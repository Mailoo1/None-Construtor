import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../config/theme';

export default function SplashScreen({ onFinish }) {
  const opacidad = useRef(new Animated.Value(0)).current;
  const escala   = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(escala,   { toValue: 1, friction: 4,   useNativeDriver: true }),
    ]).start();

    const t = setTimeout(onFinish, 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.container}>
      <View style={s.topAccent} />
      <Animated.View style={[s.contenido, { opacity: opacidad, transform: [{ scale: escala }] }]}>
        <View style={s.iconBox}>
          <Text style={s.icono}>🏗️</Text>
        </View>
        <Text style={s.titulo}>Control Obra</Text>
        <View style={s.divider} />
        <Text style={s.subtitulo}>Gestión de proyectos de construcción</Text>
      </Animated.View>
      <Animated.View style={[s.footer, { opacity: opacidad }]}>
        <View style={s.puntos}>
          <View style={[s.punto, s.puntoActivo]} />
          <View style={s.punto} />
          <View style={s.punto} />
        </View>
        <Text style={s.footerText}>Cargando...</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  topAccent:   { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: colors.primary },
  contenido:   { alignItems: 'center' },
  iconBox:     { width: 100, height: 100, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  icono:       { fontSize: 52 },
  titulo:      { fontSize: 32, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  divider:     { width: 48, height: 3, backgroundColor: colors.primary, borderRadius: 2, marginBottom: 12 },
  subtitulo:   { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  footer:      { position: 'absolute', bottom: 60, alignItems: 'center' },
  puntos:      { flexDirection: 'row', marginBottom: 12 },
  punto:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.bgContainer, marginHorizontal: 4 },
  puntoActivo: { backgroundColor: colors.primary, width: 24, borderRadius: 4 },
  footerText:  { color: colors.textDisabled, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
});