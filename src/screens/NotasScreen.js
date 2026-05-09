import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../config/theme';

const STORAGE_KEY = 'control_obra_notas';

const COLORES_NOTA = [
  colors.primary,
  colors.info,
  colors.success,
  colors.warning,
  colors.danger,
];

export default function NotasScreen() {
  const [notas,        setNotas]        = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando,     setEditando]     = useState(null); // nota que se edita
  const [titulo,       setTitulo]       = useState('');
  const [contenido,    setContenido]    = useState('');
  const [colorSel,     setColorSel]     = useState(COLORES_NOTA[0]);

  useEffect(() => { cargarNotas(); }, []);

  const cargarNotas = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setNotas(JSON.parse(raw));
    } catch (e) { console.log(e); }
  };

  const guardarEnStorage = async (nuevasNotas) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevasNotas));
    } catch (e) { console.log(e); }
  };

  const abrirNueva = () => {
    setEditando(null);
    setTitulo('');
    setContenido('');
    setColorSel(COLORES_NOTA[0]);
    setModalVisible(true);
  };

  const abrirEditar = (nota) => {
    setEditando(nota);
    setTitulo(nota.titulo);
    setContenido(nota.contenido);
    setColorSel(nota.color ?? COLORES_NOTA[0]);
    setModalVisible(true);
  };

  const guardarNota = async () => {
    if (!contenido.trim()) { Alert.alert('Escribe algo', 'La nota no puede estar vacía.'); return; }

    let nuevas;
    if (editando) {
      nuevas = notas.map(n =>
        n.id === editando.id
          ? { ...n, titulo: titulo.trim(), contenido: contenido.trim(), color: colorSel, editadoEn: new Date().toISOString() }
          : n
      );
    } else {
      const nueva = {
        id:        Date.now().toString(),
        titulo:    titulo.trim(),
        contenido: contenido.trim(),
        color:     colorSel,
        creadoEn:  new Date().toISOString(),
      };
      nuevas = [nueva, ...notas];
    }

    setNotas(nuevas);
    await guardarEnStorage(nuevas);
    setModalVisible(false);
  };

  const eliminarNota = (id) => {
    Alert.alert('Eliminar nota', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const nuevas = notas.filter(n => n.id !== id);
        setNotas(nuevas);
        await guardarEnStorage(nuevas);
      }},
    ]);
  };

  const fechaLegible = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <View style={s.container}>
      <FlatList
        data={notas}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <View>
            <View style={s.headerRow}>
              <Text style={s.titulo}>Notas</Text>
              <TouchableOpacity style={s.btnAdd} onPress={abrirNueva}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            <Text style={s.hint}>Toca una nota para editarla. Mantén para eliminar.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.card, { borderLeftColor: item.color ?? colors.primary }]}
            onPress={() => abrirEditar(item)}
            onLongPress={() => eliminarNota(item.id)}
            activeOpacity={0.75}
          >
            {item.titulo ? (
              <Text style={[s.cardTitulo, { color: item.color ?? colors.primary }]} numberOfLines={1}>
                {item.titulo}
              </Text>
            ) : null}
            <Text style={s.cardContenido} numberOfLines={6}>{item.contenido}</Text>
            <Text style={s.cardFecha}>{fechaLegible(item.editadoEn ?? item.creadoEn)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.vacio}>
            <Ionicons name="document-text-outline" size={52} color={colors.textMuted} />
            <Text style={s.vacioText}>Sin notas</Text>
            <Text style={s.vacioSub}>Toca el + para crear tu primera nota</Text>
          </View>
        }
      />

      {/* ── Modal crear / editar nota ───────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitulo}>{editando ? 'Editar nota' : 'Nueva nota'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Selector de color */}
              <View style={s.coloresRow}>
                {COLORES_NOTA.map(c => (
                  <TouchableOpacity key={c}
                    style={[s.colorDot, { backgroundColor: c }, colorSel === c && s.colorDotSel]}
                    onPress={() => setColorSel(c)}
                  />
                ))}
              </View>

              <Text style={s.label}>Título (opcional)</Text>
              <TextInput
                style={s.input}
                placeholder="Ej: Pendientes importantes"
                placeholderTextColor={colors.textMuted}
                value={titulo}
                onChangeText={setTitulo}
              />

              <Text style={s.label}>Contenido *</Text>
              <TextInput
                style={s.textarea}
                placeholder="Escribe lo que no quieres olvidar..."
                placeholderTextColor={colors.textMuted}
                value={contenido}
                onChangeText={setContenido}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity style={[s.btnGuardar, { backgroundColor: colorSel }]} onPress={guardarNota}>
                <Ionicons name="checkmark" size={18} color={colors.textDark} />
                <Text style={s.btnGuardarText}>{editando ? 'Guardar cambios' : 'Crear nota'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titulo:         { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnAdd:         { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  hint:           { fontSize: 12, color: colors.textMuted, marginBottom: 14 },
  card:           { flex: 1, backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, minHeight: 100 },
  cardTitulo:     { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  cardContenido:  { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  cardFecha:      { fontSize: 10, color: colors.textDisabled, marginTop: 10 },
  vacio:          { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:      { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:       { fontSize: 13, color: colors.textMuted },
  // modal
  modalOverlay:   { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo:    { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  coloresRow:     { flexDirection: 'row', gap: 10, marginBottom: 16 },
  colorDot:       { width: 28, height: 28, borderRadius: 14 },
  colorDotSel:    { borderWidth: 3, borderColor: colors.textPrimary, transform: [{ scale: 1.2 }] },
  label:          { fontSize: 12, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:          { backgroundColor: colors.bgContainer, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, marginBottom: 14 },
  textarea:       { backgroundColor: colors.bgContainer, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, height: 130, marginBottom: 16 },
  btnGuardar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, padding: 16 },
  btnGuardarText: { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
});
