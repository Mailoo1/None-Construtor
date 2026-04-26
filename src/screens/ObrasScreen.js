import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

export default function ObrasScreen() {
  const [obras,          setObras]          = useState([]);
  const [modalVisible,   setModalVisible]   = useState(false);
  const [nombre,         setNombre]         = useState('');
  const [descripcion,    setDescripcion]    = useState('');
  const [ubicacion,      setUbicacion]      = useState('');
  const [loading,        setLoading]        = useState(false);

  useEffect(() => { cargarObras(); }, []);

  const cargarObras = async () => {
    try {
      const uid = auth.currentUser?.uid;
      const q   = query(collection(db, 'obras'), where('uid', '==', uid));
      const snap = await getDocs(q);
      setObras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const agregarObra = async () => {
    if (!nombre) { Alert.alert('Campo requerido', 'El nombre es obligatorio.'); return; }
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      await addDoc(collection(db, 'obras'), {
        uid,
        nombre,
        descripcion,
        ubicacion,
        estado:    'activa',
        creadoEn:  new Date().toISOString(),
      });
      setNombre('');
      setDescripcion('');
      setUbicacion('');
      setModalVisible(false);
      cargarObras();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const eliminarObra = (id) => {
    Alert.alert('Eliminar obra', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'obras', id));
        cargarObras();
      }},
    ]);
  };

  return (
    <View style={s.container}>
      <FlatList
        data={obras}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            <View style={s.headerRow}>
              <Text style={s.titulo}>Mis Obras</Text>
              <TouchableOpacity style={s.btnAdd} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            <Text style={s.seccionLabel}>OBRAS REGISTRADAS</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardIconBox}>
              <Ionicons name="business-outline" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{item.nombre}</Text>
              {item.descripcion ? <Text style={s.detalle}>{item.descripcion}</Text> : null}
              {item.ubicacion   ? (
                <View style={s.ubicRow}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={s.ubicText}>{item.ubicacion}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.cardActions}>
              <View style={s.badge}>
                <Text style={s.badgeText}>{item.estado}</Text>
              </View>
              <TouchableOpacity onPress={() => eliminarObra(item.id)} style={s.btnEliminar}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.vacio}>
            <Ionicons name="business-outline" size={52} color={colors.textMuted} />
            <Text style={s.vacioText}>No tienes obras registradas</Text>
            <Text style={s.vacioSub}>Agrega tu primera obra con el botón +</Text>
          </View>
        }
      />

      {/* Modal agregar obra */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Nueva obra</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Nombre de la obra *</Text>
            <TextInput style={s.input} placeholder="Ej: Torre Residencial Norte"
              placeholderTextColor={colors.textMuted} value={nombre} onChangeText={setNombre} />

            <Text style={s.label}>Descripción</Text>
            <TextInput style={[s.input, { height: 80 }]} placeholder="Describe la obra..."
              placeholderTextColor={colors.textMuted} value={descripcion} onChangeText={setDescripcion}
              multiline numberOfLines={3} />

            <Text style={s.label}>Ubicación</Text>
            <TextInput style={s.input} placeholder="Ej: Calle 50 # 30-20, Medellín"
              placeholderTextColor={colors.textMuted} value={ubicacion} onChangeText={setUbicacion} />

            <TouchableOpacity style={[s.btnGuardar, loading && { opacity: 0.6 }]}
              onPress={agregarObra} disabled={loading}>
              <Text style={s.btnGuardarText}>{loading ? 'Guardando...' : 'Guardar obra'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:       { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnAdd:       { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  seccionLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card:         { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  cardIconBox:  { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary + '55', justifyContent: 'center', alignItems: 'center' },
  nombre:       { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  detalle:      { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  ubicRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ubicText:     { fontSize: 11, color: colors.textMuted },
  cardActions:  { alignItems: 'flex-end', gap: 8 },
  badge:        { backgroundColor: colors.success + '22', borderWidth: 1, borderColor: colors.success + '55', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:    { fontSize: 10, color: colors.success, fontWeight: '600' },
  btnEliminar:  { padding: 4 },
  vacio:        { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:    { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:     { fontSize: 13, color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:  { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  label:        { fontSize: 12, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:        { backgroundColor: colors.bgContainer, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, marginBottom: 14 },
  btnGuardar:   { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 4 },
  btnGuardarText: { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
});