import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { colors } from '../config/theme';

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const getMensajeError = (codigo) => {
    switch (codigo) {
      case 'auth/invalid-email':
        return 'El correo ingresado no tiene un formato válido. Revísalo e intenta de nuevo.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Tu cuenta fue bloqueada temporalmente por seguridad. Intenta más tarde o restablece tu contraseña.';
      case 'auth/network-request-failed':
        return 'Sin conexión a internet. Revisa tu red e intenta de nuevo.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido desactivada. Contacta al administrador de la obra.';
      default:
        return 'No pudimos iniciar sesión. Verifica tus datos o intenta más tarde.';
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña para continuar.');
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      const mensaje = getMensajeError(e.code);
      Alert.alert('No pudimos ingresarte', mensaje, [{ text: 'Entendido', style: 'default' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.topAccent} />
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <View style={s.logoBox}><Text style={s.logoEmoji}>🏗️</Text></View>
        <Text style={s.titulo}>Control Obra</Text>
        <Text style={s.subtitulo}>Inicia sesión para continuar</Text>

        <View style={s.form}>
          <Text style={s.label}>Correo electrónico</Text>
          <TextInput style={s.input} placeholder="correo@ejemplo.com" placeholderTextColor={colors.textMuted}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Contraseña</Text>
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={colors.textMuted}
            value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            <Text style={s.btnText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
          <Text style={s.link}>¿No tienes cuenta? <Text style={s.linkAccent}>Regístrate</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bgPrimary },
  topAccent:  { height: 4, backgroundColor: colors.primary },
  inner:      { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoBox:    { width: 80, height: 80, borderRadius: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, alignSelf: 'center' },
  logoEmoji:  { fontSize: 40 },
  titulo:     { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  subtitulo:  { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  form:       { marginBottom: 24 },
  label:      { fontSize: 12, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:      { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, color: colors.textPrimary, fontSize: 15, marginBottom: 16 },
  btn:        { backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 4, elevation: 6 },
  btnOff:     { opacity: 0.6 },
  btnText:    { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
  link:       { textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
  linkAccent: { color: colors.primary, fontWeight: '600' },
});