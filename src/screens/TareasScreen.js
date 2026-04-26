import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

const prioridadColor = { alta: colors.danger, media: colors.warning, baja: colors.info };
const estadoConfig   = {
  'pendiente':  { icon: 'time-outline',             color: colors.warning },
  'en proceso': { icon: 'reload-outline',           color: colors.info    },
  'completada': { icon: 'checkmark-circle-outline', color: colors.success },
};
const filtros    = ['Todas', 'pendiente', 'en proceso', 'completada'];
const prioridades = ['alta', 'media', 'baja'];

export default function TareasScreen() {
  const [tareas,       setTareas]       = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('Todas');
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo,       setTitulo]       = useState('');
  const [descripcion,  setDescripcion]  = useState('');
  const [prioridad,    setPrioridad]    = useState('media');
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { cargarTareas(); }, []);

  const cargarTareas = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      const q    = query(collection(db, 'tareas'), where('uid', '==', uid));
      const snap = await getDocs(q);
      setTareas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const agregarTarea = async () => {
    if (!titulo) { Alert.alert('Campo requerido', 'El título es obligatorio.'); return; }
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      await addDoc(collection(db, 'tareas'), {
        uid, titulo, descripcion, prioridad,
        estado:   'pendiente',
        creadoEn: new Date().toISOString(),
      });
      setTitulo(''); setDescripcion(''); setPrioridad('media');
      setModalVisible(false);
      cargarTareas();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const cambiarEstado = async (tarea) => {
    const orden  = ['pendiente', 'en proceso', 'completada'];
    const actual = orden.indexOf(tarea.estado);
    const nuevo  = orden[(actual + 1) % orden.length];
    try {
      await updateDoc(doc(db, 'tareas', tarea.id), { estado: nuevo });
      cargarTareas();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const eliminarTarea = (id) => {
    Alert.alert('Eliminar tarea', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'tareas', id));
        cargarTareas();
      }},
    ]);
  };

  const tareasFiltradas = filtroActivo === 'Todas'
    ? tareas
    : tareas.filter(t => t.estado === filtroActivo);

  const pendientes  = tareas.filter(t => t.estado === 'pendiente').length;
  const enProceso   = tareas.filter(t => t.estado === 'en proceso').length;
  const completadas = tareas.filter(t => t.estado === 'completada').length;

  return (
    <View style={s.container}>
      <FlatList
        data={tareasFiltradas}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            <View style={s.headerRow}>
              <Text style={s.titulo}>Tareas</Text>
              <TouchableOpacity style={s.btnAdd} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Resumen */}
            <View style={s.resumen}>
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.warning }]}>{pendientes}</Text>
                <Text style={s.resumenLabel}>Pendientes</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.info }]}>{enProceso}</Text>
                <Text style={s.resumenLabel}>En proceso</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.success }]}>{completadas}</Text>
                <Text style={s.resumenLabel}>Completadas</Text>
              </View>
            </View>

            {/* Filtros */}
            <View style={s.filtros}>
              {filtros.map(f => (
                <TouchableOpacity key={f}
                  style={[s.filtroBtn, filtroActivo === f && s.filtroBtnActivo]}
                  onPress={() => setFiltroActivo(f)}>
                  <Text style={[s.filtroText, filtroActivo === f && s.filtroTextActivo]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.seccionLabel}>LISTADO</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <TouchableOpacity onPress={() => cambiarEstado(item)}>
              <Ionicons name={estadoConfig[item.estado].icon} size={28} color={estadoConfig[item.estado].color} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[s.taskTitulo, item.estado === 'completada' && s.tachado]}>
                {item.titulo}
              </Text>
              {item.descripcion ? (
                <Text style={s.taskDesc}>{item.descripcion}</Text>
              ) : null}
              <Text style={[s.estadoText, { color: estadoConfig[item.estado].color }]}>
                {item.estado}
              </Text>
            </View>
            <View style={s.cardRight}>
              <View style={[s.badge, {
                backgroundColor: prioridadColor[item.prioridad] + '22',
                borderColor:     prioridadColor[item.prioridad] + '55',
              }]}>
                <Text style={[s.badgeText, { color: prioridadColor[item.prioridad] }]}>
                  {item.prioridad}
                </Text>
              </View>
              <TouchableOpacity onPress={() => eliminarTarea(item.id)} style={s.btnEliminar}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.vacio}>
            <Ionicons name="checkbox-outline" size={48} color={colors.textMuted} />
            <Text style={s.vacioText}>No hay tareas</Text>
            <Text style={s.vacioSub}>Agrega tu primera tarea con el botón +</Text>
          </View>
        }
      />

      {/* Modal agregar tarea */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Nueva tarea</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Título *</Text>
            <TextInput style={s.input} placeholder="Ej: Fundir columnas bloque A"
              placeholderTextColor={colors.textMuted} value={titulo} onChangeText={setTitulo} />

            <Text style={s.label}>Descripción</Text>
            <TextInput style={[s.input, { height: 80 }]}
              placeholder="Describe qué se debe hacer..."
              placeholderTextColor={colors.textMuted} value={descripcion}
              onChangeText={setDescripcion} multiline numberOfLines={3} />

            <Text style={s.label}>Prioridad</Text>
            <View style={s.prioridadRow}>
              {prioridades.map(p => (
                <TouchableOpacity key={p}
                  style={[s.prioridadBtn, prioridad === p && {
                    backgroundColor: prioridadColor[p] + '33',
                    borderColor:     prioridadColor[p],
                  }]}
                  onPress={() => setPrioridad(p)}>
                  <Text style={[s.prioridadText, prioridad === p && { color: prioridadColor[p], fontWeight: '700' }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.btnGuardar, loading && { opacity: 0.6 }]}
              onPress={agregarTarea} disabled={loading}>
              <Text style={s.btnGuardarText}>{loading ? 'Guardando...' : 'Guardar tarea'}</Text>
            </TouchableOpacity>
          </View>
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
  resumen:          { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-around' },
  resumenItem:      { alignItems: 'center' },
  resumenNum:       { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  resumenLabel:     { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  divider:          { width: 1, backgroundColor: colors.border },
  filtros:          { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filtroBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filtroBtnActivo:  { backgroundColor: colors.primary, borderColor: colors.primary },
  filtroText:       { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  filtroTextActivo: { color: colors.textDark, fontWeight: '700' },
  seccionLabel:     { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card:             { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  taskTitulo:       { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  tachado:          { textDecorationLine: 'line-through', color: colors.textMuted },
  taskDesc:         { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  estadoText:       { fontSize: 12, marginTop: 4, fontWeight: '500' },
  cardRight:        { alignItems: 'flex-end', gap: 8 },
  badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText:        { fontSize: 11, fontWeight: '600' },
  btnEliminar:      { padding: 4 },
  vacio:            { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:        { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:         { fontSize: 13, color: colors.textMuted },
  modalOverlay:     { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:         { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:      { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  label:            { fontSize: 12, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:            { backgroundColor: colors.bgContainer, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, marginBottom: 14 },
  prioridadRow:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  prioridadBtn:     { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bgContainer },
  prioridadText:    { fontSize: 13, color: colors.textSecondary },
  btnGuardar:       { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center' },
  btnGuardarText:   { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
});