import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

export default function PerfilScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'usuarios', uid));
      if (snap.exists()) setUsuario(snap.data());
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <View style={s.container}>

      {/* Botón menú hamburguesa */}
      <TouchableOpacity style={s.menuBtn} onPress={() => setMenuAbierto(!menuAbierto)}>
        <Ionicons name="menu" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Menú desplegable */}
      {menuAbierto && (
        <View style={s.menuDesplegable}>
          <TouchableOpacity style={s.menuItem} onPress={() => { setMenuAbierto(false); }}>
            <Ionicons name="person-outline" size={18} color={colors.textPrimary} />
            <Text style={s.menuItemText}>Editar perfil</Text>
          </TouchableOpacity>
          <View style={s.menuDivider} />
          <TouchableOpacity style={s.menuItem} onPress={() => { setMenuAbierto(false); cerrarSesion(); }}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[s.menuItemText, { color: colors.danger }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={s.avatarBox}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {usuario?.nombre ? usuario.nombre[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={s.nombre}>{usuario?.nombre ?? 'Sin nombre'}</Text>
          <Text style={s.email}>{usuario?.email ?? ''}</Text>
        </View>

        {/* Info */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>Información de la cuenta</Text>

          <View style={s.infoRow}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Nombre</Text>
              <Text style={s.infoValor}>{usuario?.nombre ?? '-'}</Text>
            </View>
          </View>

          <View style={s.separador} />

          <View style={s.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Correo</Text>
              <Text style={s.infoValor}>{usuario?.email ?? '-'}</Text>
            </View>
          </View>

          <View style={s.separador} />

          <View style={s.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Miembro desde</Text>
              <Text style={s.infoValor}>
                {usuario?.creadoEn
                  ? new Date(usuario.creadoEn).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Botón cerrar sesión */}
        <TouchableOpacity style={s.btnSalir} onPress={cerrarSesion} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.textDark} />
          <Text style={s.btnSalirText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bgPrimary },
  menuBtn:         { position: 'absolute', top: 16, right: 16, zIndex: 100, backgroundColor: colors.bgCard, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  menuDesplegable: { position: 'absolute', top: 60, right: 16, zIndex: 200, backgroundColor: colors.bgCard, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingVertical: 8, minWidth: 180, elevation: 10 },
  menuItem:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  menuItemText:    { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  menuDivider:     { height: 1, backgroundColor: colors.border, marginHorizontal: 12 },
  inner:           { padding: 24, paddingTop: 60 },
  avatarBox:       { alignItems: 'center', marginBottom: 28 },
  avatar:          { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primary + '33', borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:      { fontSize: 38, fontWeight: 'bold', color: colors.primary },
  nombre:          { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  email:           { fontSize: 14, color: colors.textSecondary },
  card:            { backgroundColor: colors.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  cardTitulo:      { fontSize: 12, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', textTransform: 'uppercase', marginBottom: 16 },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  infoLabel:       { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  infoValor:       { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  separador:       { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  btnSalir:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.danger, borderRadius: 10, padding: 16, elevation: 4 },
  btnSalirText:    { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
});