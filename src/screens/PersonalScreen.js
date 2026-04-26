import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

const datosDemo = [
  { id: '1', nombre: 'Carlos Ramírez', cargo: 'Maestro de obra',  diasTrabajados: 22, estado: 'activo'   },
  { id: '2', nombre: 'Luis Torres',    cargo: 'Electricista',     diasTrabajados: 18, estado: 'activo'   },
  { id: '3', nombre: 'Ana Morales',    cargo: 'Arquitecta',       diasTrabajados: 10, estado: 'inactivo' },
  { id: '4', nombre: 'Pedro Gómez',   cargo: 'Ayudante',         diasTrabajados: 20, estado: 'activo'   },
  { id: '5', nombre: 'Jorge Díaz',    cargo: 'Plomero',          diasTrabajados: 5,  estado: 'inactivo' },
];

export default function PersonalScreen() {
  const activos   = datosDemo.filter(p => p.estado === 'activo').length;
  const inactivos = datosDemo.filter(p => p.estado === 'inactivo').length;

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
              <Text style={s.titulo}>Personal</Text>
              <TouchableOpacity style={s.btnAdd}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Resumen */}
            <View style={s.resumen}>
              <View style={s.resumenItem}>
                <Text style={s.resumenNum}>{datosDemo.length}</Text>
                <Text style={s.resumenLabel}>Total</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.success }]}>{activos}</Text>
                <Text style={s.resumenLabel}>Activos</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.danger }]}>{inactivos}</Text>
                <Text style={s.resumenLabel}>Inactivos</Text>
              </View>
            </View>

            <Text style={s.seccionLabel}>TRABAJADORES</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.nombre[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{item.nombre}</Text>
              <Text style={s.cargo}>{item.cargo}</Text>
              <View style={s.diasRow}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text style={s.dias}>{item.diasTrabajados} días trabajados</Text>
              </View>
            </View>
            <View style={[s.badge, {
              backgroundColor: item.estado === 'activo' ? colors.success + '22' : colors.danger + '22',
              borderColor:     item.estado === 'activo' ? colors.success + '55' : colors.danger + '55',
            }]}>
              <Text style={[s.badgeText, {
                color: item.estado === 'activo' ? colors.success : colors.danger
              }]}>{item.estado}</Text>
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
  avatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '33', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '55' },
  avatarText:   { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  nombre:       { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cargo:        { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  diasRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dias:         { fontSize: 11, color: colors.textMuted },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
});