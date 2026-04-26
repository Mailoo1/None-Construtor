import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

export default function MaterialesScreen() {
  const [registros,    setRegistros]    = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [material,     setMaterial]     = useState('');
  const [cantidad,     setCantidad]     = useState('');
  const [proveedor,    setProveedor]    = useState('');
  const [recibio,      setRecibio]      = useState('');
  const [notas,        setNotas]        = useState('');
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { cargarRegistros(); }, []);

  const cargarRegistros = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      const q    = query(collection(db, 'materiales'), where('uid', '==', uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setRegistros(data);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const agregarRegistro = async () => {
    if (!material || !cantidad) {
      Alert.alert('Campos requeridos', 'Material y cantidad son obligatorios.');
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      await addDoc(collection(db, 'materiales'), {
        uid, material, cantidad, proveedor, recibio, notas,
        fecha:    new Date().toISOString(),
        fechaStr: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
        horaStr:  new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      });
      setMaterial(''); setCantidad(''); setProveedor('');
      setRecibio(''); setNotas('');
      setModalVisible(false);
      cargarRegistros();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const eliminarRegistro = (id) => {
    Alert.alert('Eliminar registro', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'materiales', id));
        cargarRegistros();
      }},
    ]);
  };

  return (
    <View style={s.container}>
      <FlatList
        data={registros}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            <View style={s.headerRow}>
              <Text style={s.titulo}>Materiales</Text>
              <TouchableOpacity style={s.btnAdd} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={s.infoBanner}>
              <Ionicons name="information-circle-outline" size={18} color={colors.info} />
              <Text style={s.infoBannerText}>
                Registra cada vez que llegue material a la obra con fecha, hora y quién lo recibió.
              </Text>
            </View>

            <View style={s.resumen}>
              <View style={s.resumenItem}>
                <Text style={s.resumenNum}>{registros.length}</Text>
                <Text style={s.resumenLabel}>Registros</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.primary }]}>
                  {new Set(registros.map(r => r.material)).size}
                </Text>
                <Text style={s.resumenLabel}>Materiales</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.success }]}>
                  {new Set(registros.map(r => r.proveedor).filter(Boolean)).size}
                </Text>
                <Text style={s.resumenLabel}>Proveedores</Text>
              </View>
            </View>

            <Text style={s.seccionLabel}>HISTORIAL DE ENTREGAS</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardLeft}>
              <Ionicons name="cube-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.materialNombre}>{item.material}</Text>
              <Text style={s.materialCantidad}>Cantidad: {item.cantidad}</Text>
              {item.proveedor ? (
                <View style={s.infoRow}>
                  <Ionicons name="business-outline" size={11} color={colors.textMuted} />
                  <Text style={s.infoText}>De: {item.proveedor}</Text>
                </View>
              ) : null}
              {item.recibio ? (
                <View style={s.infoRow}>
                  <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                  <Text style={s.infoText}>Recibió: {item.recibio}</Text>
                </View>
              ) : null}
              {item.notas ? (
                <Text style={s.notas}>{item.notas}</Text>
              ) : null}
              <View style={s.fechaRow}>
                <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                <Text style={s.fechaText}>{item.fechaStr} · {item.horaStr}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => eliminarRegistro(item.id)} style={s.btnEliminar}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.vacio}>
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
            <Text style={s.vacioText}>Sin registros de materiales</Text>
            <Text style={s.vacioSub}>Registra el primer material que llegue a la obra</Text>
          </View>
        }
      />

      {/* Modal agregar registro */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView
            style={s.modalBox}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Registrar material</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={s.fechaAuto}>
              📅 {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' })} · {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </Text>

            <Text style={s.label}>Material *</Text>
            <TextInput style={s.input} placeholder="Ej: Cemento, Arena, Varilla..."
              placeholderTextColor={colors.textMuted} value={material} onChangeText={setMaterial} />

            <Text style={s.label}>Cantidad *</Text>
            <TextInput style={s.input} placeholder="Ej: 50 bultos, 3 m³, 100 unidades"
              placeholderTextColor={colors.textMuted} value={cantidad} onChangeText={setCantidad} />

            <Text style={s.label}>Proveedor / Procedencia</Text>
            <TextInput style={s.input} placeholder="Ej: Cemex, Ferretería El Constructor"
              placeholderTextColor={colors.textMuted} value={proveedor} onChangeText={setProveedor} />

            <Text style={s.label}>Quién recibió</Text>
            <TextInput style={s.input} placeholder="Ej: Carlos Ramírez"
              placeholderTextColor={colors.textMuted} value={recibio} onChangeText={setRecibio} />

            <Text style={s.label}>Notas adicionales</Text>
            <TextInput style={[s.input, { height: 70 }]} placeholder="Observaciones, estado del material..."
              placeholderTextColor={colors.textMuted} value={notas} onChangeText={setNotas}
              multiline numberOfLines={3} />

            <TouchableOpacity style={[s.btnGuardar, loading && { opacity: 0.6 }]}
              onPress={agregarRegistro} disabled={loading}>
              <Text style={s.btnGuardarText}>{loading ? 'Guardando...' : 'Registrar llegada'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:           { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnAdd:           { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  infoBanner:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.info + '22', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.info + '44' },
  infoBannerText:   { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  resumen:          { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-around' },
  resumenItem:      { alignItems: 'center' },
  resumenNum:       { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  resumenLabel:     { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  divider:          { width: 1, backgroundColor: colors.border },
  seccionLabel:     { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card:             { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: colors.border },
  cardLeft:         { width: 42, height: 42, borderRadius: 10, backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary + '55', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  materialNombre:   { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  materialCantidad: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2 },
  infoRow:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  infoText:         { fontSize: 12, color: colors.textSecondary },
  notas:            { fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  fechaRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  fechaText:        { fontSize: 11, color: colors.textMuted },
  btnEliminar:      { padding: 4 },
  vacio:            { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:        { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:         { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  modalOverlay:     { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:         { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, maxHeight: '90%' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitulo:      { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  fechaAuto:        { fontSize: 12, color: colors.textSecondary, marginBottom: 16, fontStyle: 'italic' },
  label:            { fontSize: 12, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:            { backgroundColor: colors.bgContainer, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, marginBottom: 14 },
  btnGuardar:       { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 4 },
  btnGuardarText:   { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
});