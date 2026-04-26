import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

const datosDemo = [
  { id: '1', nombre: 'Cemento',  cantidad: 50,  unidad: 'bultos', estado: 'disponible' },
  { id: '2', nombre: 'Arena',    cantidad: 20,  unidad: 'm³',     estado: 'bajo'       },
  { id: '3', nombre: 'Varilla',  cantidad: 100, unidad: 'unid',   estado: 'disponible' },
  { id: '4', nombre: 'Ladrillo', cantidad: 0,   unidad: 'unid',   estado: 'agotado'    },
  { id: '5', nombre: 'Grava',    cantidad: 15,  unidad: 'm³',     estado: 'bajo'       },
];

const estadoColor = {
  disponible: colors.success,
  bajo:       colors.warning,
  agotado:    colors.danger,
};

const estadoIcon = {
  disponible: 'checkmark-circle-outline',
  bajo:       'alert-circle-outline',
  agotado:    'close-circle-outline',
};

export default function MaterialesScreen() {
  return (
    <View style={s.container}>
      <FlatList
        data={datosDemo}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={s.headerRow}>
              <Text style={s.titulo}>Materiales</Text>
              <TouchableOpacity style={s.btnAdd}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Resumen */}
            <View style={s.resumen}>
              <View style={s.resumenItem}>
                <Text style={s.resumenNum}>5</Text>
                <Text style={s.resumenLabel}>Total</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.success }]}>2</Text>
                <Text style={s.resumenLabel}>Disponibles</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.warning }]}>2</Text>
                <Text style={s.resumenLabel}>Bajos</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.danger }]}>1</Text>
                <Text style={s.resumenLabel}>Agotados</Text>
              </View>
            </View>

            <Text style={s.seccionLabel}>INVENTARIO</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.cardLeft, { backgroundColor: estadoColor[item.estado] + '22', borderColor: estadoColor[item.estado] + '44' }]}>
              <Ionicons name="cube-outline" size={26} color={estadoColor[item.estado]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{item.nombre}</Text>
              <Text style={s.detalle}>{item.cantidad} {item.unidad}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: estadoColor[item.estado] + '22', borderColor: estadoColor[item.estado] + '55' }]}>
              <Ionicons name={estadoIcon[item.estado]} size={12} color={estadoColor[item.estado]} />
              <Text style={[s.badgeText, { color: estadoColor[item.estado] }]}>{item.estado}</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
  cardLeft:     { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  nombre:       { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  detalle:      { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
});