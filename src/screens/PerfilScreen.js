import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../config/firebase';
import { subirImagen } from '../config/cloudinary';
import { colors } from '../config/theme';

export default function PerfilScreen({ navigation }) {
  const [usuario,      setUsuario]      = useState(null);
  const [editando,     setEditando]     = useState(false);
  const [nombre,       setNombre]       = useState('');
  const [telefono,     setTelefono]     = useState('');
  const [cargo,        setCargo]        = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { cargarUsuario(); }, []);

  const cargarUsuario = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'usuarios', uid));
      if (snap.exists()) {
        const data = snap.data();
        setUsuario(data);
        setNombre(data.nombre   ?? '');
        setTelefono(data.telefono ?? '');
        setCargo(data.cargo     ?? '');
      }
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const guardarPerfil = async () => {
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      await updateDoc(doc(db, 'usuarios', uid), { nombre, telefono, cargo });
      setUsuario(prev => ({ ...prev, nombre, telefono, cargo }));
      setEditando(false);
      Alert.alert('✅ Guardado', 'Perfil actualizado correctamente.');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!resultado.canceled) {
        setSubiendoFoto(true);
        const url = await subirImagen(resultado.assets[0].uri);
        const uid = auth.currentUser?.uid;
        await updateDoc(doc(db, 'usuarios', uid), { fotoPerfil: url });
        setUsuario(prev => ({ ...prev, fotoPerfil: url }));
        Alert.alert('✅ Foto actualizada', 'Tu foto de perfil fue actualizada.');
      }
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSubiendoFoto(false); }
  };

  const tomarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.');
        return;
      }
      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!resultado.canceled) {
        setSubiendoFoto(true);
        const url = await subirImagen(resultado.assets[0].uri);
        const uid = auth.currentUser?.uid;
        await updateDoc(doc(db, 'usuarios', uid), { fotoPerfil: url });
        setUsuario(prev => ({ ...prev, fotoPerfil: url }));
        Alert.alert('✅ Foto actualizada', 'Tu foto de perfil fue actualizada.');
      }
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSubiendoFoto(false); }
  };

  const opcionesFoto = () => {
    Alert.alert('Foto de perfil', '¿Cómo quieres subir tu foto?', [
      { text: 'Cancelar',       style: 'cancel'                },
      { text: '📷 Tomar foto',  onPress: tomarFoto             },
      { text: '🖼️ Galería',     onPress: seleccionarFoto       },
    ]);
  };

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* Avatar */}
      <View style={s.avatarSection}>
        <TouchableOpacity style={s.avatarBox} onPress={opcionesFoto} activeOpacity={0.8}>
          {subiendoFoto ? (
            <View style={s.avatar}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : usuario?.fotoPerfil ? (
            <Image source={{ uri: usuario.fotoPerfil }} style={s.avatarImg} />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {usuario?.nombre ? usuario.nombre[0].toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={s.avatarCamara}>
            <Ionicons name="camera" size={14} color={colors.textDark} />
          </View>
        </TouchableOpacity>
        <Text style={s.nombre}>{usuario?.nombre ?? 'Sin nombre'}</Text>
        <Text style={s.email}>{usuario?.email ?? ''}</Text>
        {usuario?.cargo ? <Text style={s.cargo}>{usuario.cargo}</Text> : null}
      </View>

      {/* Info / Editar */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitulo}>Información personal</Text>
          <TouchableOpacity onPress={() => editando ? guardarPerfil() : setEditando(true)}
            style={[s.btnEditar, editando && { backgroundColor: colors.success }]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.textDark} />
            ) : (
              <>
                <Ionicons name={editando ? 'checkmark' : 'pencil'} size={14} color={colors.textDark} />
                <Text style={s.btnEditarText}>{editando ? 'Guardar' : 'Editar'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <View style={s.campo}>
          <Ionicons name="person-outline" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.campoLabel}>Nombre</Text>
            {editando ? (
              <TextInput style={s.campoInput} value={nombre} onChangeText={setNombre}
                placeholderTextColor={colors.textMuted} placeholder="Tu nombre" />
            ) : (
              <Text style={s.campoValor}>{usuario?.nombre ?? '-'}</Text>
            )}
          </View>
        </View>

        <View style={s.sep} />

        {/* Cargo */}
        <View style={s.campo}>
          <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.campoLabel}>Cargo / Rol</Text>
            {editando ? (
              <TextInput style={s.campoInput} value={cargo} onChangeText={setCargo}
                placeholderTextColor={colors.textMuted} placeholder="Ej: Maestro de obra" />
            ) : (
              <Text style={s.campoValor}>{usuario?.cargo ?? '-'}</Text>
            )}
          </View>
        </View>

        <View style={s.sep} />

        {/* Teléfono */}
        <View style={s.campo}>
          <Ionicons name="call-outline" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.campoLabel}>Teléfono</Text>
            {editando ? (
              <TextInput style={s.campoInput} value={telefono} onChangeText={setTelefono}
                placeholderTextColor={colors.textMuted} placeholder="Ej: 300 123 4567"
                keyboardType="phone-pad" />
            ) : (
              <Text style={s.campoValor}>{usuario?.telefono ?? '-'}</Text>
            )}
          </View>
        </View>

        <View style={s.sep} />

        {/* Correo (no editable) */}
        <View style={s.campo}>
          <Ionicons name="mail-outline" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.campoLabel}>Correo electrónico</Text>
            <Text style={s.campoValor}>{usuario?.email ?? '-'}</Text>
          </View>
        </View>

        <View style={s.sep} />

        {/* Miembro desde */}
        <View style={s.campo}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.campoLabel}>Miembro desde</Text>
            <Text style={s.campoValor}>
              {usuario?.creadoEn
                ? new Date(usuario.creadoEn).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
                : '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* Cancelar edición */}
      {editando && (
        <TouchableOpacity style={s.btnCancelar} onPress={() => setEditando(false)}>
          <Text style={s.btnCancelarText}>Cancelar</Text>
        </TouchableOpacity>
      )}

      {/* Cerrar sesión */}
      <TouchableOpacity style={s.btnSalir} onPress={cerrarSesion} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={colors.textDark} />
        <Text style={s.btnSalirText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.bgPrimary, paddingHorizontal: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarBox:     { position: 'relative', marginBottom: 12 },
  avatar:        { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary + '33', borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarImg:     { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: colors.primary },
  avatarText:    { fontSize: 42, fontWeight: 'bold', color: colors.primary },
  avatarCamara:  { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.bgPrimary },
  nombre:        { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  email:         { fontSize: 13, color: colors.textSecondary },
  cargo:         { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' },
  card:          { backgroundColor: colors.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitulo:    { fontSize: 12, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', textTransform: 'uppercase' },
  btnEditar:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnEditarText: { fontSize: 12, color: colors.textDark, fontWeight: '700' },
  campo:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  campoLabel:    { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  campoValor:    { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  campoInput:    { fontSize: 15, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.primary, paddingVertical: 4 },
  sep:           { height: 1, backgroundColor: colors.border },
  btnCancelar:   { backgroundColor: colors.bgCard, borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  btnCancelarText: { color: colors.textSecondary, fontWeight: '600' },
  btnSalir:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.danger, borderRadius: 10, padding: 16, elevation: 4, marginBottom: 12 },
  btnSalirText:  { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
});