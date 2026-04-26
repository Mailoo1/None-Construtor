import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

const datosDemo = [
  { id: '1', titulo: 'Fundir columnas bloque A',    prioridad: 'alta',  estado: 'pendiente'  },
  { id: '2', titulo: 'Instalar tuberías piso 2',    prioridad: 'media', estado: 'en proceso' },
  { id: '3', titulo: 'Revisar planos eléctricos',   prioridad: 'baja',  estado: 'completada' },
  { id: '4', titulo: 'Comprar cemento adicional',   prioridad: 'alta',  estado: 'pendiente'  },
  { id: '5', titulo: 'Nivelar piso bloque B',       prioridad: 'media', estado: 'en proceso' },
  { id: '6', titulo: 'Inspección de estructuras',   prioridad: 'alta',  estado: 'completada' },
];

const prioridadColor = {
  alta:  colors.danger,
  media: colors.warning,
  baja:  colors.info,
};

const estadoConfig = {
  'pendiente':  { icon: 'time-outline',             color: colors.warning },
  'en proceso': { icon: 'reload-outline',           color: colors.info    },
  'completada': { icon: 'checkmark-circle-outline', color: colors.success },
};

const filtros = ['Todas', 'pendiente', 'en proceso', 'completada'];

export default function TareasScreen() {
  const [filtroActivo, setFiltroActivo] = useState('Todas');

  const tareasFiltradas = filtroActivo === 'Todas'
    ? datosDemo
    : datosDemo.filter(t => t.estado === filtroActivo);

  const pendientes  = datosDemo.filter(t => t.estado === 'pendiente').length;
  const enProceso   = datosDemo.filter(t => t.estado === 'en proceso').length;
  const completadas = datosDemo.filter(t => t.estado === 'completada').length;

  return (
    <View style={s.container}>
      <FlatList
        data={tareasFiltradas}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={s.headerRow}>
              <Text style={s.titulo}>Tareas</Text>
              <TouchableOpacity style={s.btnAdd}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Resumen */}
            <View style={s.resumen}>
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.warning }]}>{pendientes}</Text>
                <Text style={s.resumenLabel}>Pendientes</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.info }]}>{enProceso}</Text>
                <Text style={s.resumenLabel}>En proceso</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.success }]}>{completadas}</Text>
                <Text style={s.resumenLabel}>Completadas</Text>
              </View>
            </View>

            {/* Filtros */}
            <View style={s.filtros}>
              {filtros.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[s.filtroBtn, filtroActivo === f && s.filtroBtnActivo]}
                  onPress={() => setFiltroActivo(f)}
                >
                  <Text style={[s.filtroText, filtroActivo === f && s.filtroTextActivo]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.seccionLabel}>LISTADO</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Ionicons
              name={estadoConfig[item.estado].icon}
              size={26}
              color={estadoConfig[item.estado].color}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.taskTitulo, item.estado === 'completada' && s.tachado]}>
                {item.titulo}
              </Text>
              <Text style={[s.estadoText, { color: estadoConfig[item.estado].color }]}>
                {item.estado}
              </Text>
            </View>
            <View style={[s.badge, {
              backgroundColor: prioridadColor[item.prioridad] + '22',
              borderColor:     prioridadColor[item.prioridad] + '55',
            }]}>
              <Text style={[s.badgeText, { color: prioridadColor[item.prioridad] }]}>
                {item.prioridad}
              </Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:           { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnAdd:           { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  resumen:          { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-around' },
  resumenItem:      { alignItems: 'center' },
  resumenNum:       { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  resumenLabel:     { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  divider:          { width: 1, backgroundColor: colors.border },
  filtros:          { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filtroBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filtroBtnActivo:  { backgroundColor: colors.primary, borderColor: colors.primary },
  filtroText:       { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  filtroTextActivo: { color: colors.textDark, fontWeight: '700' },
  seccionLabel:     { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card:             { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  taskTitulo:       { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  tachado:          { textDecorationLine: 'line-through', color: colors.textMuted },
  estadoText:       { fontSize: 12, marginTop: 2, fontWeight: '500' },
  badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText:        { fontSize: 11, fontWeight: '600' },
});