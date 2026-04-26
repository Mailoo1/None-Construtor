import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

const datosDemo = [
  { id: '1', nombre: 'Plano estructural piso 1', tipo: 'PDF',   fecha: '2026-03-10', tamaño: '2.4 MB' },
  { id: '2', nombre: 'Plano eléctrico general',  tipo: 'IMG',   fecha: '2026-03-15', tamaño: '1.8 MB' },
  { id: '3', nombre: 'Plano hidráulico',         tipo: 'PDF',   fecha: '2026-04-01', tamaño: '3.1 MB' },
  { id: '4', nombre: 'Fachada principal',        tipo: 'IMG',   fecha: '2026-04-10', tamaño: '0.9 MB' },
];

const tipoConfig = {
  PDF: { icon: 'document-text-outline', color: colors.danger  },
  IMG: { icon: 'image-outline',         color: colors.info    },
};

export default function PlanosScreen() {
  const [planos, setPlanos] = useState(datosDemo);

  const eliminarPlano = (id) => {
    Alert.alert('Eliminar plano', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        setPlanos(prev => prev.filter(p => p.id !== id));
      }},
    ]);
  };

  return (
    <View style={s.container}>
      <FlatList
        data={planos}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={s.headerRow}>
              <Text style={s.titulo}>Planos</Text>
              <TouchableOpacity style={s.btnAdd}
                onPress={() => Alert.alert('Próximamente', 'Subida de planos con Cloudinary en la siguiente entrega.')}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Resumen */}
            <View style={s.resumen}>
              <View style={s.resumenItem}>
                <Text style={s.resumenNum}>{planos.length}</Text>
                <Text style={s.resumenLabel}>Total</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.danger }]}>
                  {planos.filter(p => p.tipo === 'PDF').length}
                </Text>
                <Text style={s.resumenLabel}>PDFs</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.info }]}>
                  {planos.filter(p => p.tipo === 'IMG').length}
                </Text>
                <Text style={s.resumenLabel}>Imágenes</Text>
              </View>
            </View>

            <Text style={s.seccionLabel}>ARCHIVOS</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.iconBox, {
              backgroundColor: tipoConfig[item.tipo].color + '22',
              borderColor:     tipoConfig[item.tipo].color + '55',
            }]}>
              <Ionicons name={tipoConfig[item.tipo].icon} size={26} color={tipoConfig[item.tipo].color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{item.nombre}</Text>
              <Text style={s.detalle}>{item.fecha} · {item.tamaño}</Text>
            </View>
            <TouchableOpacity onPress={() => eliminarPlano(item.id)} style={s.btnEliminar}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.vacio}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={s.vacioText}>No hay planos registrados</Text>
            <Text style={s.vacioSub}>Agrega tu primer plano con el botón +</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:       { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnAdd:       { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  resumen:      { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-around' },
  resumenItem:  { alignItems: 'center' },
  resumenNum:   { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  resumenLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  divider:      { width: 1, backgroundColor: colors.border },
  seccionLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card:         { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  iconBox:      { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  nombre:       { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  detalle:      { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  btnEliminar:  { padding: 8 },
  vacio:        { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:    { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:     { fontSize: 13, color: colors.textMuted },
});