import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';
import {
  guardarPersonalLocal,
  obtenerPersonalLocal,
  eliminarPersonalLocal,
} from '../config/database';

// 7 días × 2 semanas
const SEMANAS = {
  'S1': ['S1-Lun', 'S1-Mar', 'S1-Mié', 'S1-Jue', 'S1-Vie', 'S1-Sáb', 'S1-Dom'],
  'S2': ['S2-Lun', 'S2-Mar', 'S2-Mié', 'S2-Jue', 'S2-Vie', 'S2-Sáb', 'S2-Dom'],
};
const LABELS = {
  'S1-Lun': 'Lun', 'S1-Mar': 'Mar', 'S1-Mié': 'Mié', 'S1-Jue': 'Jue',
  'S1-Vie': 'Vie', 'S1-Sáb': 'Sáb', 'S1-Dom': 'Dom',
  'S2-Lun': 'Lun', 'S2-Mar': 'Mar', 'S2-Mié': 'Mié', 'S2-Jue': 'Jue',
  'S2-Vie': 'Vie', 'S2-Sáb': 'Sáb', 'S2-Dom': 'Dom',
};

const asistenciaVacia = () => {
  const obj = {};
  [...SEMANAS['S1'], ...SEMANAS['S2']].forEach(d => { obj[d] = 'libre'; });
  return obj;
};

const estadoAsistencia = {
  presente: { color: colors.success, icon: 'checkmark-circle' },
  ausente:  { color: colors.danger,  icon: 'close-circle'     },
  temprano: { color: colors.warning, icon: 'time'             },
  libre:    { color: colors.border,  icon: 'remove-circle'    },
};

const siguienteEstado = (actual) => {
  const orden = ['libre', 'presente', 'ausente', 'temprano'];
  return orden[(orden.indexOf(actual) + 1) % orden.length];
};

export default function PersonalScreen() {
  const [personal,      setPersonal]      = useState([]);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [asistModal,    setAsistModal]    = useState(false);
  const [trabajadorSel, setTrabajadorSel] = useState(null);
  const [semanaTab,     setSemanaTab]     = useState('S1');

  // Campos nuevo trabajador
  const [nombre,    setNombre]    = useState('');
  const [cargo,     setCargo]     = useState('');
  const [telefono,  setTelefono]  = useState('');
  const [precioDia, setPrecioDia] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sinInternet, setSinInternet] = useState(false);
  const [precioModal,   setPrecioModal]   = useState(false);
  const [trabajadorPrecio, setTrabajadorPrecio] = useState(null);
  const [nuevoPrecio,  setNuevoPrecio]  = useState('');

  useEffect(() => { cargarPersonal(); }, []);

  const cargarPersonal = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      const q    = query(collection(db, 'personal'), where('uid', '==', uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.forEach(p => guardarPersonalLocal(p));
      setPersonal(data);
      setSinInternet(false);
    } catch (e) {
      console.log('Sin internet, cargando personal desde SQLite...');
      const uid   = auth.currentUser?.uid;
      const local = obtenerPersonalLocal(uid);
      setPersonal(local.map(p => ({
        id:        p.firebase_id,
        uid:       p.uid,
        nombre:    p.nombre,
        cargo:     p.cargo,
        telefono:  p.telefono,
        precioDia: p.precio_dia ?? 0,
        estado:    p.estado,
        creadoEn:  p.creado_en,
        asistencia: asistenciaVacia(),
      })));
      setSinInternet(true);
    }
  };

  const agregarTrabajador = async () => {
    if (!nombre || !cargo) {
      Alert.alert('Campos requeridos', 'Nombre y cargo son obligatorios.');
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      const ref = await addDoc(collection(db, 'personal'), {
        uid, nombre, cargo, telefono,
        precioDia: parseFloat(precioDia) || 0,
        estado:     'activo',
        asistencia: asistenciaVacia(),
        creadoEn:   new Date().toISOString(),
      });
      guardarPersonalLocal({
        id: ref.id, uid, nombre, cargo, telefono,
        estado: 'activo', creadoEn: new Date().toISOString(),
      });
      setNombre(''); setCargo(''); setTelefono(''); setPrecioDia('');
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

  const abrirEditarPrecio = (trabajador) => {
    setTrabajadorPrecio(trabajador);
    setNuevoPrecio(trabajador.precioDia > 0 ? String(trabajador.precioDia) : '');
    setPrecioModal(true);
  };

  const guardarPrecio = async () => {
    if (!nuevoPrecio || isNaN(parseFloat(nuevoPrecio))) {
      Alert.alert('Valor inválido', 'Ingresa un número válido.');
      return;
    }
    try {
      await updateDoc(doc(db, 'personal', trabajadorPrecio.id), {
        precioDia: parseFloat(nuevoPrecio),
      });
      setPrecioModal(false);
      cargarPersonal();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const eliminarTrabajador = (id) => {
    Alert.alert('Eliminar trabajador', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'personal', id));
        eliminarPersonalLocal(id);
        cargarPersonal();
      }},
    ]);
  };

  const marcarAsistencia = async (trabajador, dia) => {
    const actual  = trabajador.asistencia?.[dia] ?? 'libre';
    const nuevo   = siguienteEstado(actual);
    const asist   = { ...trabajador.asistencia, [dia]: nuevo };
    try {
      await updateDoc(doc(db, 'personal', trabajador.id), { asistencia: asist });
      setTrabajadorSel(prev => ({ ...prev, asistencia: asist }));
      cargarPersonal();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  // Días trabajados (presente o temprano) en ambas semanas
  const diasTrabajados = (asistencia) => {
    if (!asistencia) return 0;
    return Object.values(asistencia).filter(v => v === 'presente' || v === 'temprano').length;
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

            {sinInternet && (
              <View style={s.offlineBanner}>
                <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
                <Text style={s.offlineText}>Sin conexión — mostrando datos locales</Text>
              </View>
            )}

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
        renderItem={({ item }) => {
          const dias = diasTrabajados(item.asistencia);
          return (
            <View style={s.card}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.nombre[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.nombre}>{item.nombre}</Text>
                <Text style={s.cargo}>{item.cargo}</Text>
                {item.telefono ? (
                  <View style={s.infoRow}>
                    <Ionicons name="call-outline" size={11} color={colors.textMuted} />
                    <Text style={s.infoText}>{item.telefono}</Text>
                  </View>
                ) : null}
                <View style={s.infoRow}>
                  <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                  <Text style={s.infoText}>{dias} días trabajados</Text>
                  {item.precioDia > 0 && (
                    <Text style={s.precioTag}>
                      ${(item.precioDia * dias).toLocaleString('es-CO')}
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={s.precioRow} onPress={() => abrirEditarPrecio(item)}>
                  <Ionicons name="cash-outline" size={11} color={item.precioDia > 0 ? colors.success : colors.warning} />
                  <Text style={[s.precioLabel, { color: item.precioDia > 0 ? colors.success : colors.warning }]}>
                    {item.precioDia > 0
                      ? `$${item.precioDia.toLocaleString('es-CO')}/día`
                      : 'Toca para fijar precio/día'}
                  </Text>
                  <Ionicons name="pencil-outline" size={10} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.btnAsist}
                  onPress={() => { setTrabajadorSel(item); setSemanaTab('S1'); setAsistModal(true); }}>
                  <Ionicons name="calendar-outline" size={16} color={colors.info} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.badge, {
                  backgroundColor: item.estado === 'activo' ? colors.success + '22' : colors.danger + '22',
                  borderColor:     item.estado === 'activo' ? colors.success + '55' : colors.danger + '55',
                }]} onPress={() => toggleEstado(item)}>
                  <Text style={[s.badgeText, { color: item.estado === 'activo' ? colors.success : colors.danger }]}>
                    {item.estado}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => eliminarTrabajador(item.id)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.vacio}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={s.vacioText}>No hay personal registrado</Text>
            <Text style={s.vacioSub}>Agrega tu primer trabajador con el botón +</Text>
          </View>
        }
      />

      {/* ── Modal agregar trabajador ──────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView
            style={s.modalBox}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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

            <Text style={s.label}>Precio por día ($)</Text>
            <TextInput style={s.input} placeholder="Ej: 120000"
              placeholderTextColor={colors.textMuted} value={precioDia} onChangeText={setPrecioDia}
              keyboardType="numeric" />

            <TouchableOpacity style={[s.btnGuardar, loading && { opacity: 0.6 }]}
              onPress={agregarTrabajador} disabled={loading}>
              <Text style={s.btnGuardarText}>{loading ? 'Guardando...' : 'Agregar trabajador'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Modal asistencia 2 semanas ────────────────────────────────────────── */}
      <Modal visible={asistModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>{trabajadorSel?.nombre}</Text>
              <TouchableOpacity onPress={() => setAsistModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tabs semana */}
            <View style={s.semanaTabRow}>
              {['S1', 'S2'].map(s_ => (
                <TouchableOpacity key={s_} style={[s.semanaTab, semanaTab === s_ && s.semanaTabActiva]}
                  onPress={() => setSemanaTab(s_)}>
                  <Text style={[s.semanaTabText, semanaTab === s_ && s.semanaTabTextActiva]}>
                    Semana {s_ === 'S1' ? '1' : '2'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Leyenda */}
            <View style={s.leyenda}>
              {Object.entries(estadoAsistencia).map(([key, val]) => (
                <View key={key} style={s.leyendaItem}>
                  <Ionicons name={val.icon} size={13} color={val.color} />
                  <Text style={[s.leyendaText, { color: val.color }]}>{key}</Text>
                </View>
              ))}
            </View>

            {/* Grid días */}
            <View style={s.diasGrid}>
              {SEMANAS[semanaTab].map(dia => {
                const estado = trabajadorSel?.asistencia?.[dia] ?? 'libre';
                const config = estadoAsistencia[estado];
                return (
                  <TouchableOpacity key={dia}
                    style={[s.diaBtn, { borderColor: config.color + '88', backgroundColor: config.color + '22' }]}
                    onPress={() => marcarAsistencia(trabajadorSel, dia)}>
                    <Text style={s.diaNombre}>{LABELS[dia]}</Text>
                    <Ionicons name={config.icon} size={22} color={config.color} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Resumen días */}
            {trabajadorSel && (
              <View style={s.resumenAsist}>
                <Text style={s.resumenAsistText}>
                  Total: <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                    {diasTrabajados(trabajadorSel.asistencia)} días trabajados
                  </Text>
                  {trabajadorSel.precioDia > 0 && (
                    <Text style={{ color: colors.success }}>
                      {' · $'}{(trabajadorSel.precioDia * diasTrabajados(trabajadorSel.asistencia)).toLocaleString('es-CO')}
                    </Text>
                  )}
                </Text>
              </View>
            )}

            <TouchableOpacity style={s.btnCerrar} onPress={() => setAsistModal(false)}>
              <Text style={s.btnCerrarText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ── Modal editar precio ───────────────────────────────────────────── */}
      <Modal visible={precioModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.precioModalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Precio por día</Text>
              <TouchableOpacity onPress={() => setPrecioModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={s.precioWorkerName}>{trabajadorPrecio?.nombre}</Text>
            <Text style={s.label}>Valor por día trabajado ($)</Text>
            <TextInput
              style={s.input}
              placeholder="Ej: 120000"
              placeholderTextColor={colors.textMuted}
              value={nuevoPrecio}
              onChangeText={setNuevoPrecio}
              keyboardType="numeric"
              autoFocus
            />
            {nuevoPrecio !== '' && !isNaN(parseFloat(nuevoPrecio)) && (
              <Text style={s.precioPreview}>
                Si trabaja 10 días → ${(parseFloat(nuevoPrecio) * 10).toLocaleString('es-CO')}
              </Text>
            )}
            <TouchableOpacity style={s.btnGuardar} onPress={guardarPrecio}>
              <Text style={s.btnGuardarText}>Guardar precio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:             { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnAdd:             { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  offlineBanner:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warning + '22', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.warning + '44' },
  offlineText:        { fontSize: 12, color: colors.warning, fontWeight: '600' },
  resumen:            { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-around' },
  resumenItem:        { alignItems: 'center' },
  resumenNum:         { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  resumenLabel:       { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  divider:            { width: 1, backgroundColor: colors.border },
  seccionLabel:       { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card:               { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border },
  avatar:             { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary + '33', borderWidth: 1, borderColor: colors.primary + '55', justifyContent: 'center', alignItems: 'center' },
  avatarText:         { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  nombre:             { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cargo:              { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  infoRow:            { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  infoText:           { fontSize: 11, color: colors.textMuted },
  precioTag:          { fontSize: 11, color: colors.success, fontWeight: '700', marginLeft: 6 },
  cardActions:        { alignItems: 'flex-end', gap: 6 },
  btnAsist:           { backgroundColor: colors.info + '22', borderWidth: 1, borderColor: colors.info + '55', borderRadius: 6, padding: 6 },
  badge:              { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText:          { fontSize: 10, fontWeight: '600' },
  vacio:              { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:          { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:           { fontSize: 13, color: colors.textMuted },
  precioRow:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  precioLabel:        { fontSize: 11, fontWeight: '600' },
  precioModalBox:     { backgroundColor: colors.bgCard, borderRadius: 16, padding: 24, marginHorizontal: 32, borderWidth: 1, borderColor: colors.border },
  precioWorkerName:   { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  precioPreview:      { fontSize: 12, color: colors.textMuted, marginBottom: 12, fontStyle: 'italic' },
  modalOverlay:       { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:           { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, maxHeight: '90%' },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:        { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  label:              { fontSize: 12, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:              { backgroundColor: colors.bgContainer, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, marginBottom: 14 },
  btnGuardar:         { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center' },
  btnGuardarText:     { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
  // asistencia
  semanaTabRow:       { flexDirection: 'row', backgroundColor: colors.bgContainer, borderRadius: 10, padding: 4, marginBottom: 16, gap: 4 },
  semanaTab:          { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  semanaTabActiva:    { backgroundColor: colors.primary },
  semanaTabText:      { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  semanaTabTextActiva:{ color: colors.textDark },
  leyenda:            { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  leyendaItem:        { flexDirection: 'row', alignItems: 'center', gap: 3 },
  leyendaText:        { fontSize: 10, fontWeight: '600' },
  diasGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 },
  diaBtn:             { width: 72, height: 72, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  diaNombre:          { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  resumenAsist:       { backgroundColor: colors.bgContainer, borderRadius: 8, padding: 10, marginBottom: 14, alignItems: 'center' },
  resumenAsistText:   { fontSize: 13, color: colors.textSecondary },
  btnCerrar:          { backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  btnCerrarText:      { color: colors.textDark, fontWeight: 'bold', fontSize: 15 },
});
