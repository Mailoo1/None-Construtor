import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const estadoAsistencia = {
  presente:  { color: colors.success, icon: 'checkmark-circle' },
  ausente:   { color: colors.danger,  icon: 'close-circle'     },
  temprano:  { color: colors.warning, icon: 'time'             },
  libre:     { color: colors.border,  icon: 'remove-circle'    },
};

export default function PersonalScreen() {
  const [personal,      setPersonal]      = useState([]);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [asistModal,    setAsistModal]    = useState(false);
  const [trabajadorSel, setTrabajadorSel] = useState(null);
  const [nombre,        setNombre]        = useState('');
  const [cargo,         setCargo]         = useState('');
  const [telefono,      setTelefono]      = useState('');
  const [loading,       setLoading]       = useState(false);

  useEffect(() => { cargarPersonal(); }, []);

  const cargarPersonal = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      const q    = query(collection(db, 'personal'), where('uid', '==', uid));
      const snap = await getDocs(q);
      setPersonal(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const agregarTrabajador = async () => {
    if (!nombre || !cargo) { Alert.alert('Campos requeridos', 'Nombre y cargo son obligatorios.'); return; }
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      await addDoc(collection(db, 'personal'), {
        uid, nombre, cargo, telefono,
        estado:     'activo',
        asistencia: { Lun: 'libre', Mar: 'libre', Mié: 'libre', Jue: 'libre', Vie: 'libre', Sáb: 'libre', Dom: 'libre' },
        creadoEn:   new Date().toISOString(),
      });
      setNombre(''); setCargo(''); setTelefono('');
      setModalVisible(false);
      cargarPersonal();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const toggleEstado = async (trabajador) => {
    const nuevoEstado = trabajador.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await updateDoc(doc(db, 'personal', trabajador.id), { estado: nuevoEstado });
      cargarPersonal();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const eliminarTrabajador = (id) => {
    Alert.alert('Eliminar trabajador', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'personal', id));
        cargarPersonal();
      }},
    ]);
  };

  const marcarAsistencia = async (trabajador, dia, nuevoEstado) => {
    try {
      const asistencia = { ...trabajador.asistencia, [dia]: nuevoEstado };
      await updateDoc(doc(db, 'personal', trabajador.id), { asistencia });
      // Actualizar local
      setTrabajadorSel(prev => ({ ...prev, asistencia }));
      cargarPersonal();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const siguienteEstado = (estadoActual) => {
    const orden = ['libre', 'presente', 'ausente', 'temprano'];
    const idx   = orden.indexOf(estadoActual);
    return orden[(idx + 1) % orden.length];
  };

  const activos   = personal.filter(p => p.estado === 'activo').length;
  const inactivos = personal.filter(p => p.estado === 'inactivo').length;

  return (
    <View style={s.container}>
      <FlatList
        data={personal}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            <View style={s.headerRow}>
              <Text style={s.titulo}>Personal</Text>
              <TouchableOpacity style={s.btnAdd} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Resumen */}
            <View style={s.resumen}>
              <View style={s.resumenItem}>
                <Text style={s.resumenNum}>{personal.length}</Text>
                <Text style={s.resumenLabel}>Total</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.success }]}>{activos}</Text>
                <Text style={s.resumenLabel}>Activos</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.danger }]}>{inactivos}</Text>
                <Text style={s.resumenLabel}>Inactivos</Text>
              </View>
            </View>

            <Text style={s.seccionLabel}>TRABAJADORES</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.nombre[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{item.nombre}</Text>
              <Text style={s.cargo}>{item.cargo}</Text>
              {item.telefono ? (
                <View style={s.telRow}>
                  <Ionicons name="call-outline" size={11} color={colors.textMuted} />
                  <Text style={s.telText}>{item.telefono}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.cardActions}>
              {/* Botón asistencia */}
              <TouchableOpacity style={s.btnAsist} onPress={() => { setTrabajadorSel(item); setAsistModal(true); }}>
                <Ionicons name="calendar-outline" size={16} color={colors.info} />
              </TouchableOpacity>
              {/* Toggle activo/inactivo */}
              <TouchableOpacity style={[s.badge, {
                backgroundColor: item.estado === 'activo' ? colors.success + '22' : colors.danger + '22',
                borderColor:     item.estado === 'activo' ? colors.success + '55' : colors.danger + '55',
              }]} onPress={() => toggleEstado(item)}>
                <Text style={[s.badgeText, { color: item.estado === 'activo' ? colors.success : colors.danger }]}>
                  {item.estado}
                </Text>
              </TouchableOpacity>
              {/* Eliminar */}
              <TouchableOpacity onPress={() => eliminarTrabajador(item.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.vacio}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={s.vacioText}>No hay personal registrado</Text>
            <Text style={s.vacioSub}>Agrega tu primer trabajador con el botón +</Text>
          </View>
        }
      />

      {/* Modal agregar trabajador */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Nuevo trabajador</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Nombre completo *</Text>
            <TextInput style={s.input} placeholder="Ej: Carlos Ramírez"
              placeholderTextColor={colors.textMuted} value={nombre} onChangeText={setNombre} />

            <Text style={s.label}>Cargo *</Text>
            <TextInput style={s.input} placeholder="Ej: Maestro de obra"
              placeholderTextColor={colors.textMuted} value={cargo} onChangeText={setCargo} />

            <Text style={s.label}>Teléfono</Text>
            <TextInput style={s.input} placeholder="Ej: 300 123 4567"
              placeholderTextColor={colors.textMuted} value={telefono} onChangeText={setTelefono}
              keyboardType="phone-pad" />

            <TouchableOpacity style={[s.btnGuardar, loading && { opacity: 0.6 }]}
              onPress={agregarTrabajador} disabled={loading}>
              <Text style={s.btnGuardarText}>{loading ? 'Guardando...' : 'Agregar trabajador'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal asistencia */}
      <Modal visible={asistModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Asistencia — {trabajadorSel?.nombre}</Text>
              <TouchableOpacity onPress={() => setAsistModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={s.asistInfo}>Toca el día para cambiar el estado</Text>

            {/* Leyenda */}
            <View style={s.leyenda}>
              {Object.entries(estadoAsistencia).map(([key, val]) => (
                <View key={key} style={s.leyendaItem}>
                  <Ionicons name={val.icon} size={14} color={val.color} />
                  <Text style={[s.leyendaText, { color: val.color }]}>{key}</Text>
                </View>
              ))}
            </View>

            {/* Días */}
            <View style={s.diasGrid}>
              {diasSemana.map(dia => {
                const estado = trabajadorSel?.asistencia?.[dia] ?? 'libre';
                const config = estadoAsistencia[estado];
                return (
                  <TouchableOpacity key={dia} style={[s.diaBtn, { borderColor: config.color + '88', backgroundColor: config.color + '22' }]}
                    onPress={() => {
                      const nuevo = siguienteEstado(estado);
                      marcarAsistencia(trabajadorSel, dia, nuevo);
                    }}>
                    <Text style={s.diaNombre}>{dia}</Text>
                    <Ionicons name={config.icon} size={22} color={config.color} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={s.btnCerrar} onPress={() => setAsistModal(false)}>
              <Text style={s.btnCerrarText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:        { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnAdd:        { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  resumen:       { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-around' },
  resumenItem:   { alignItems: 'center' },
  resumenNum:    { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  resumenLabel:  { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  divider:       { width: 1, backgroundColor: colors.border },
  seccionLabel:  { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card:          { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border },
  avatar:        { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary + '33', borderWidth: 1, borderColor: colors.primary + '55', justifyContent: 'center', alignItems: 'center' },
  avatarText:    { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  nombre:        { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cargo:         { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  telRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  telText:       { fontSize: 11, color: colors.textMuted },
  cardActions:   { alignItems: 'flex-end', gap: 6 },
  btnAsist:      { backgroundColor: colors.info + '22', borderWidth: 1, borderColor: colors.info + '55', borderRadius: 6, padding: 6 },
  badge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText:     { fontSize: 10, fontWeight: '600' },
  vacio:         { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:     { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:      { fontSize: 13, color: colors.textMuted },
  modalOverlay:  { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:   { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  label:         { fontSize: 12, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:         { backgroundColor: colors.bgContainer, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, marginBottom: 14 },
  btnGuardar:    { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center' },
  btnGuardarText:{ color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
  asistInfo:     { fontSize: 13, color: colors.textSecondary, marginBottom: 12, textAlign: 'center' },
  leyenda:       { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  leyendaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leyendaText:   { fontSize: 11, fontWeight: '600' },
  diasGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  diaBtn:        { width: 72, height: 72, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  diaNombre:     { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  btnCerrar:     { backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  btnCerrarText: { color: colors.textDark, fontWeight: 'bold', fontSize: 15 },
});