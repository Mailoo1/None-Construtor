import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

const modulos = [
  { label: 'Materiales', icon: 'cube-outline',     color: colors.primary, screen: 'Materiales' },
  { label: 'Personal',   icon: 'people-outline',   color: colors.primary, screen: 'Personal'   },
  { label: 'Tareas',     icon: 'checkbox-outline', color: colors.primary, screen: 'Tareas'     },
  { label: 'Planos',     icon: 'map-outline',      color: colors.primary, screen: 'Planos'     },
];

export default function DashboardScreen({ navigation }) {
  const [usuario,    setUsuario]    = useState(null);
  const [obras,      setObras]      = useState([]);
  const [obraActiva, setObraActiva] = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [obraModal,  setObraModal]  = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    cargarUsuario();
    cargarObras();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuOpen ? 0 : -300,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [menuOpen]);

  const cargarUsuario = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'usuarios', uid));
      if (snap.exists()) setUsuario(snap.data());
    } catch (e) { console.log(e); }
  };

  const cargarObras = async () => {
    try {
      const uid   = auth.currentUser?.uid;
      const q     = query(collection(db, 'obras'), where('uid', '==', uid));
      const snap  = await getDocs(q);
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setObras(lista);
      if (lista.length > 0 && !obraActiva) setObraActiva(lista[0]);
    } catch (e) { console.log(e); }
  };

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>

      {/* Overlay del menú */}
      {menuOpen && (
        <TouchableOpacity style={s.overlay} onPress={() => setMenuOpen(false)} activeOpacity={1} />
      )}

      {/* Menú lateral hamburguesa */}
      <Animated.View style={[s.menuLateral, { transform: [{ translateX: slideAnim }] }]}>
        {/* Perfil en el menú */}
        <View style={s.menuPerfil}>
          <View style={s.menuAvatar}>
            <Text style={s.menuAvatarText}>
              {usuario?.nombre ? usuario.nombre[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={s.menuNombre}>{usuario?.nombre ?? 'Usuario'}</Text>
          <Text style={s.menuEmail}>{usuario?.email ?? ''}</Text>
        </View>

        <View style={s.menuDivider} />

        {/* Obras en el menú */}
        <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); setObraModal(true); }}>
          <Ionicons name="business-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.menuItemText}>Mis obras</Text>
            <Text style={s.menuItemSub}>{obraActiva?.nombre ?? 'Sin obra seleccionada'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); navigation.navigate('Obras'); }}>
          <Ionicons name="add-circle-outline" size={20} color={colors.success} />
          <Text style={s.menuItemText}>Agregar obra</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); navigation.navigate('Perfil'); }}>
          <Ionicons name="person-outline" size={20} color={colors.info} />
          <Text style={s.menuItemText}>Mi perfil</Text>
        </TouchableOpacity>

        <View style={s.menuDivider} />

        <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); cerrarSesion(); }}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[s.menuItemText, { color: colors.danger }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal selector de obras */}
      <Modal visible={obraModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Seleccionar obra</Text>
              <TouchableOpacity onPress={() => setObraModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {obras.length === 0 ? (
              <View style={s.sinObras}>
                <Ionicons name="business-outline" size={40} color={colors.textMuted} />
                <Text style={s.sinObrasText}>No tienes obras registradas</Text>
                <TouchableOpacity style={s.btnAgregarObra} onPress={() => { setObraModal(false); navigation.navigate('Obras'); }}>
                  <Text style={s.btnAgregarObraText}>Agregar obra</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={obras}
                keyExtractor={i => i.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[s.obraItem, obraActiva?.id === item.id && s.obraItemActiva]}
                    onPress={() => { setObraActiva(item); setObraModal(false); }}>
                    <Ionicons name="business-outline" size={22}
                      color={obraActiva?.id === item.id ? colors.primary : colors.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.obraItemNombre, obraActiva?.id === item.id && { color: colors.primary }]}>
                        {item.nombre}
                      </Text>
                      {item.ubicacion ? <Text style={s.obraItemSub}>{item.ubicacion}</Text> : null}
                    </View>
                    {obraActiva?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Contenido principal */}
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.btnMenu} onPress={() => setMenuOpen(true)}>
            <Ionicons name="menu" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.titulo}>Control Obra 🏗️</Text>
            <Text style={s.subtitulo}>Hola, {usuario?.nombre ?? 'Bienvenido'} 👷</Text>
          </View>
        </View>

        {/* Obra activa */}
        <TouchableOpacity style={s.obraSelector} onPress={() => setObraModal(true)} activeOpacity={0.8}>
          <View style={s.obraBar} />
          <View style={{ flex: 1 }}>
            <Text style={s.obraTitulo}>OBRA ACTIVA</Text>
            <Text style={s.obraNombre}>
              {obraActiva ? obraActiva.nombre : 'Toca para seleccionar obra'}
            </Text>
            {obraActiva?.ubicacion ? (
              <View style={s.ubicRow}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={s.ubicText}>{obraActiva.ubicacion}</Text>
              </View>
            ) : null}
          </View>
          <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Grid módulos */}
        <View style={s.seccion}>
          <Text style={s.seccionLabel}>MÓDULOS</Text>
          <View style={s.linea} />
        </View>
        <View style={s.grid}>
          {modulos.map((m) => (
            <TouchableOpacity key={m.label} style={s.card} activeOpacity={0.75}
              onPress={() => navigation.navigate(m.screen)}>
              <View style={[s.iconBox, { backgroundColor: m.color + '22', borderColor: m.color + '55' }]}>
                <Ionicons name={m.icon} size={26} color={m.color} />
              </View>
              <Text style={s.cardLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Acciones rápidas */}
        <View style={s.seccion}>
          <Text style={s.seccionLabel}>ACCIONES RÁPIDAS</Text>
          <View style={s.linea} />
        </View>
        <View style={s.acciones}>
          <TouchableOpacity style={s.accionPrimary} onPress={() => navigation.navigate('Tareas')} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={18} color={colors.textDark} />
            <Text style={s.accionTextP}>Nueva tarea</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.accionSecondary} onPress={() => navigation.navigate('Personal')} activeOpacity={0.8}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <Text style={s.accionTextS}>Personal</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bgPrimary, paddingHorizontal: 16 },
  overlay:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066', zIndex: 50 },
  menuLateral:     { position: 'absolute', top: 0, left: 0, bottom: 0, width: 280, backgroundColor: colors.bgCard, zIndex: 100, borderRightWidth: 1, borderRightColor: colors.border, paddingTop: 60, paddingHorizontal: 0, elevation: 20 },
  menuPerfil:      { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  menuAvatar:      { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary + '33', borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  menuAvatarText:  { fontSize: 30, fontWeight: 'bold', color: colors.primary },
  menuNombre:      { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  menuEmail:       { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  menuDivider:     { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  menuItem:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  menuItemText:    { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  menuItemSub:     { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  modalOverlay:    { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:        { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%', borderWidth: 1, borderColor: colors.border },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo:     { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  sinObras:        { alignItems: 'center', paddingVertical: 30, gap: 10 },
  sinObrasText:    { fontSize: 15, color: colors.textSecondary },
  btnAgregarObra:  { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  btnAgregarObraText: { color: colors.textDark, fontWeight: 'bold' },
  obraItem:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  obraItemActiva:  { backgroundColor: colors.primary + '11', borderRadius: 8, paddingHorizontal: 8 },
  obraItemNombre:  { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  obraItemSub:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  header:          { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16 },
  btnMenu:         { backgroundColor: colors.bgCard, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  titulo:          { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  subtitulo:       { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  obraSelector:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border, gap: 10 },
  obraBar:         { width: 3, height: 36, borderRadius: 2, backgroundColor: colors.primary },
  obraTitulo:      { fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
  obraNombre:      { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  ubicRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ubicText:        { fontSize: 11, color: colors.textMuted },
  seccion:         { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  seccionLabel:    { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600' },
  linea:           { flex: 1, height: 1, backgroundColor: colors.bgContainer },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  card:            { width: '47%', backgroundColor: colors.bgCard, borderRadius: 10, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, elevation: 3 },
  iconBox:         { width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1 },
  cardLabel:       { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  acciones:        { flexDirection: 'row', gap: 10, marginBottom: 8 },
  accionPrimary:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 8, padding: 14, elevation: 5 },
  accionSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.bgCard, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.primary },
  accionTextP:     { color: colors.textDark, fontWeight: 'bold', fontSize: 14 },
  accionTextS:     { color: colors.primary, fontWeight: '600', fontSize: 14 },
});