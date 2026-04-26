import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

const modulos = [
  { label: 'Materiales', icon: 'cube-outline',     color: colors.primary,  screen: 'Materiales' },
  { label: 'Personal',   icon: 'people-outline',   color: colors.success,  screen: 'Personal'   },
  { label: 'Tareas',     icon: 'checkbox-outline', color: colors.warning,  screen: 'Tareas'     },
  { label: 'Planos',     icon: 'map-outline',      color: colors.info,     screen: 'Planos'     },
  { label: 'Obras',      icon: 'business-outline', color: colors.danger,   screen: 'Obras'      },
  { label: 'Perfil',     icon: 'person-outline',   color: colors.textMuted,screen: 'Perfil'     },
];

export default function DashboardScreen({ navigation }) {
  const [usuario,      setUsuario]      = useState(null);
  const [obras,        setObras]        = useState([]);
  const [obraActiva,   setObraActiva]   = useState(null);
  const [menuObras,    setMenuObras]    = useState(false);

  useEffect(() => {
    cargarUsuario();
    cargarObras();
  }, []);

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
      const uid  = auth.currentUser?.uid;
      const q    = query(collection(db, 'obras'), where('uid', '==', uid));
      const snap = await getDocs(q);
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
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.titulo}>Control Obra 🏗️</Text>
          <Text style={s.subtitulo}>Hola, {usuario?.nombre ?? 'Bienvenido'} 👷</Text>
        </View>
        <TouchableOpacity style={s.btnSalir} onPress={cerrarSesion}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Selector de obra activa */}
      <TouchableOpacity style={s.obraSelector} onPress={() => setMenuObras(!menuObras)} activeOpacity={0.8}>
        <View style={s.obraBar} />
        <View style={{ flex: 1 }}>
          <Text style={s.obraTitulo}>Obra activa</Text>
          <Text style={s.obraNombre}>
            {obraActiva ? obraActiva.nombre : 'Sin obra seleccionada'}
          </Text>
          {obraActiva?.ubicacion ? (
            <View style={s.ubicRow}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={s.ubicText}>{obraActiva.ubicacion}</Text>
            </View>
          ) : null}
        </View>
        <Ionicons name={menuObras ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Menú desplegable de obras */}
      {menuObras && (
        <View style={s.menuObras}>
          {obras.length === 0 ? (
            <TouchableOpacity style={s.menuObraItem} onPress={() => { setMenuObras(false); navigation.navigate('Obras'); }}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[s.menuObraText, { color: colors.primary }]}>Agregar primera obra</Text>
            </TouchableOpacity>
          ) : (
            <>
              {obras.map(o => (
                <TouchableOpacity key={o.id} style={s.menuObraItem}
                  onPress={() => { setObraActiva(o); setMenuObras(false); }}>
                  <Ionicons name="business-outline" size={18}
                    color={obraActiva?.id === o.id ? colors.primary : colors.textSecondary} />
                  <Text style={[s.menuObraText,
                    obraActiva?.id === o.id && { color: colors.primary, fontWeight: '700' }]}>
                    {o.nombre}
                  </Text>
                  {obraActiva?.id === o.id && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <View style={s.menuDivider} />
              <TouchableOpacity style={s.menuObraItem}
                onPress={() => { setMenuObras(false); navigation.navigate('Obras'); }}>
                <Ionicons name="add-circle-outline" size={18} color={colors.success} />
                <Text style={[s.menuObraText, { color: colors.success }]}>Gestionar obras</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

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
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bgPrimary, paddingHorizontal: 16 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 },
  titulo:         { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  subtitulo:      { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  btnSalir:       { backgroundColor: colors.bgCard, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  obraSelector:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border, gap: 10 },
  obraBar:        { width: 3, height: 36, borderRadius: 2, backgroundColor: colors.primary },
  obraTitulo:     { fontSize: 11, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  obraNombre:     { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  ubicRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ubicText:       { fontSize: 11, color: colors.textMuted },
  menuObras:      { backgroundColor: colors.bgCard, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: 'hidden' },
  menuObraItem:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  menuObraText:   { flex: 1, fontSize: 14, color: colors.textSecondary },
  menuDivider:    { height: 1, backgroundColor: colors.border },
  seccion:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  seccionLabel:   { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600' },
  linea:          { flex: 1, height: 1, backgroundColor: colors.bgContainer },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  card:           { width: '47%', backgroundColor: colors.bgCard, borderRadius: 10, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, elevation: 3 },
  iconBox:        { width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1 },
  cardLabel:      { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  acciones:       { flexDirection: 'row', gap: 10, marginBottom: 8 },
  accionPrimary:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 8, padding: 14, elevation: 5 },
  accionSecondary:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.bgCard, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.primary },
  accionTextP:    { color: colors.textDark, fontWeight: 'bold', fontSize: 14 },
  accionTextS:    { color: colors.primary, fontWeight: '600', fontSize: 14 },
});