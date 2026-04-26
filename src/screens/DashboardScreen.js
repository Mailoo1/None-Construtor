import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

const modulos = [
  { label: 'Materiales', icon: 'cube-outline',         color: colors.primary,  screen: 'Materiales' },
  { label: 'Personal',   icon: 'people-outline',       color: colors.success,  screen: 'Personal'   },
  { label: 'Tareas',     icon: 'checkbox-outline',     color: colors.warning,  screen: 'Tareas'     },
  { label: 'Bitácora',   icon: 'book-outline',         color: colors.info,     screen: 'Bitacora'   },
  { label: 'Planos',     icon: 'map-outline',          color: colors.danger,   screen: 'Planos'     },
  { label: 'Perfil',     icon: 'person-outline',       color: colors.textMuted,screen: 'Perfil'     },
];

export default function DashboardScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, 'usuarios', uid));
        if (snap.exists()) setUsuario(snap.data());
      } catch (e) { console.log(e); }
    };
    cargarUsuario();
  }, []);

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

      {/* Banner proyecto */}
      <View style={s.banner}>
        <View style={s.bannerBar} />
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitulo}>Proyecto activo</Text>
          <Text style={s.bannerSub}>Torre Residencial Norte · En proceso</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>🟠 Activo</Text>
        </View>
      </View>

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
        <TouchableOpacity style={s.accionSecondary} onPress={() => navigation.navigate('Materiales')} activeOpacity={0.8}>
          <Ionicons name="cube-outline" size={18} color={colors.primary} />
          <Text style={s.accionTextS}>Materiales</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bgPrimary, paddingHorizontal: 16 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 },
  titulo:          { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  subtitulo:       { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  btnSalir:        { backgroundColor: colors.bgCard, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  banner:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border, gap: 10 },
  bannerBar:       { width: 3, height: 36, borderRadius: 2, backgroundColor: colors.primary },
  bannerTitulo:    { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  bannerSub:       { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge:           { backgroundColor: colors.primary + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '55' },
  badgeText:       { fontSize: 11, color: colors.primary, fontWeight: '600' },
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