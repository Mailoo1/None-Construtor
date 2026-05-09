import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print  from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';

const PERIODOS = ['Semana 1', 'Semana 2', 'Quincenal (ambas semanas)'];

const contarDiasPorPeriodo = (asistencia, periodo) => {
  if (!asistencia) return 0;
  const entries = Object.entries(asistencia);
  if (periodo === 'Semana 1')
    return entries.filter(([k, v]) => k.startsWith('S1-') && (v === 'presente' || v === 'temprano')).length;
  if (periodo === 'Semana 2')
    return entries.filter(([k, v]) => k.startsWith('S2-') && (v === 'presente' || v === 'temprano')).length;
  return entries.filter(([, v]) => v === 'presente' || v === 'temprano').length;
};

// ── HTML del PDF ──────────────────────────────────────────────────────────────
const generarHTML = (periodo, trabajadores, totalGeneral) => {
  const fecha = new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const filas = trabajadores.map((t, i) => {
    const dias  = contarDiasPorPeriodo(t.asistencia, periodo);
    const precio = t.precioDia ?? 0;
    const total  = precio * dias;
    return `
      <tr class="${i % 2 === 0 ? 'par' : 'impar'}">
        <td>${t.nombre}</td>
        <td>${t.cargo ?? '-'}</td>
        <td class="center">${dias}</td>
        <td class="right">${precio > 0 ? '$' + precio.toLocaleString('es-CO') : '-'}</td>
        <td class="right bold ${total > 0 ? 'verde' : ''}">${total > 0 ? '$' + total.toLocaleString('es-CO') : '-'}</td>
      </tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #D4A373; padding-bottom: 20px; }
    .empresa { font-size: 26px; font-weight: 800; color: #1a1a1a; }
    .subtitulo { font-size: 13px; color: #888; margin-top: 4px; }
    .badge { background: #D4A373; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; }

    .info-row { display: flex; gap: 32px; margin-bottom: 28px; }
    .info-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; display: block; margin-bottom: 4px; }
    .info-item span  { font-size: 14px; font-weight: 600; color: #1a1a1a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #1C1C1E; color: #fff; padding: 12px 14px; text-align: left; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; }
    th.center { text-align: center; }
    th.right  { text-align: right; }
    td { padding: 11px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    tr.par  td { background: #fafafa; }
    tr.impar td { background: #fff; }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: 700; }
    .verde  { color: #30D158; }

    .total-box { background: #1C1C1E; border-radius: 12px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .total-label { color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .total-monto { color: #D4A373; font-size: 28px; font-weight: 800; margin-top: 4px; }
    .total-right  { text-align: right; }
    .total-trabajadores { color: #888; font-size: 12px; }

    .footer { text-align: center; font-size: 11px; color: #bbb; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="empresa">Control Obra 🏗️</div>
      <div class="subtitulo">Resumen de nómina</div>
    </div>
    <div class="badge">${periodo}</div>
  </div>

  <div class="info-row">
    <div class="info-item">
      <label>Fecha de emisión</label>
      <span>${fecha}</span>
    </div>
    <div class="info-item">
      <label>Período</label>
      <span>${periodo}</span>
    </div>
    <div class="info-item">
      <label>Trabajadores</label>
      <span>${trabajadores.length} activos</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Trabajador</th>
        <th>Cargo</th>
        <th class="center">Días</th>
        <th class="right">Precio/día</th>
        <th class="right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${filas}
    </tbody>
  </table>

  <div class="total-box">
    <div>
      <div class="total-label">Total a pagar</div>
      <div class="total-monto">$${totalGeneral.toLocaleString('es-CO')}</div>
    </div>
    <div class="total-right">
      <div class="total-trabajadores">${trabajadores.length} trabajadores</div>
    </div>
  </div>

  <div class="footer">Generado con Control Obra · ${fecha}</div>

</body>
</html>`;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function FacturacionScreen() {
  const [personal,    setPersonal]    = useState([]);
  const [periodoSel,  setPeriodoSel]  = useState('Quincenal (ambas semanas)');
  const [generando,   setGenerando]   = useState(false);

  useFocusEffect(
    useCallback(() => { cargarPersonal(); }, [])
  );

  const cargarPersonal = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      const q    = query(collection(db, 'personal'), where('uid', '==', uid));
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.estado === 'activo');
      setPersonal(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el personal.');
    }
  };

  const diasDelPeriodo = (asistencia) => contarDiasPorPeriodo(asistencia, periodoSel);

  const totalGeneral = personal.reduce((acc, t) =>
    acc + (t.precioDia ?? 0) * diasDelPeriodo(t.asistencia), 0);

  // ── Generar y compartir PDF ─────────────────────────────────────────────────
  const compartirPDF = async () => {
    if (personal.length === 0) {
      Alert.alert('Sin personal', 'No hay trabajadores activos para generar la factura.');
      return;
    }
    try {
      setGenerando(true);
      const html = generarHTML(periodoSel, personal, totalGeneral);

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const puedeCompartir = await Sharing.isAvailableAsync();
      if (!puedeCompartir) {
        Alert.alert('No disponible', 'Tu dispositivo no soporta compartir archivos.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Nómina ${periodoSel}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF: ' + e.message);
    } finally {
      setGenerando(false);
    }
  };

  const estadoBadge = (dias) => {
    if (dias === 0) return { color: colors.danger,  label: '0 días' };
    if (dias < 5)   return { color: colors.warning, label: `${dias}d` };
    return             { color: colors.success, label: `${dias}d` };
  };

  return (
    <View style={s.container}>
      <FlatList
        data={personal}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <View style={s.headerRow}>
              <Text style={s.titulo}>Facturación</Text>
              <TouchableOpacity
                style={[s.btnPDF, generando && { opacity: 0.6 }]}
                onPress={compartirPDF}
                disabled={generando}
              >
                {generando
                  ? <ActivityIndicator size="small" color={colors.textDark} />
                  : <Ionicons name="document-outline" size={18} color={colors.textDark} />
                }
                <Text style={s.btnPDFText}>{generando ? 'Generando...' : 'PDF'}</Text>
              </TouchableOpacity>
            </View>

            {/* Selector período */}
            <Text style={s.label}>PERÍODO</Text>
            <View style={s.periodoRow}>
              {PERIODOS.map(p => (
                <TouchableOpacity key={p}
                  style={[s.periodoBtn, periodoSel === p && s.periodoBtnActivo]}
                  onPress={() => setPeriodoSel(p)}>
                  <Text style={[s.periodoBtnText, periodoSel === p && s.periodoBtnTextActivo]}
                    numberOfLines={2}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Total */}
            <View style={s.totalCard}>
              <View>
                <Text style={s.totalLabel}>TOTAL A PAGAR</Text>
                <Text style={s.totalMonto}>${totalGeneral.toLocaleString('es-CO')}</Text>
                <Text style={s.totalSub}>{personal.length} trabajadores · {periodoSel}</Text>
              </View>
              <Ionicons name="receipt-outline" size={36} color={colors.primary + '66'} />
            </View>

            <Text style={[s.label, { marginTop: 8 }]}>TRABAJADORES</Text>
          </View>
        }
        renderItem={({ item }) => {
          const dias  = diasDelPeriodo(item.asistencia);
          const total = (item.precioDia ?? 0) * dias;
          const badge = estadoBadge(dias);
          return (
            <View style={s.card}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.nombre[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.nombre}>{item.nombre}</Text>
                <Text style={s.cargo}>{item.cargo}</Text>
                <View style={s.infoRow}>
                  <Ionicons name="cash-outline" size={11} color={colors.textMuted} />
                  <Text style={s.infoText}>
                    {item.precioDia > 0
                      ? `$${(item.precioDia).toLocaleString('es-CO')}/día`
                      : 'Sin precio — ve a Personal'}
                  </Text>
                </View>
              </View>
              <View style={s.cardRight}>
                <View style={[s.diasBadge, { backgroundColor: badge.color + '22', borderColor: badge.color + '55' }]}>
                  <Text style={[s.diasBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
                {total > 0 && <Text style={s.subtotal}>${total.toLocaleString('es-CO')}</Text>}
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.vacio}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={s.vacioText}>Sin personal activo</Text>
            <Text style={s.vacioSub}>Agrega trabajadores en la sección Personal</Text>
          </View>
        }
        ListFooterComponent={
          personal.length > 0 ? (
            <TouchableOpacity
              style={[s.btnCompartirFull, generando && { opacity: 0.6 }]}
              onPress={compartirPDF}
              disabled={generando}
            >
              {generando
                ? <ActivityIndicator size="small" color={colors.textDark} />
                : <Ionicons name="share-social-outline" size={20} color={colors.textDark} />
              }
              <Text style={s.btnCompartirFullText}>
                {generando ? 'Generando PDF...' : 'Compartir PDF por WhatsApp / Email'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:              { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnPDF:              { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnPDFText:          { color: colors.textDark, fontWeight: '700', fontSize: 13 },
  label:               { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 10 },
  periodoRow:          { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodoBtn:          { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center' },
  periodoBtnActivo:    { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  periodoBtnText:      { fontSize: 11, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  periodoBtnTextActivo:{ color: colors.primary },
  totalCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 12, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: colors.primary + '44', borderLeftWidth: 4, borderLeftColor: colors.primary },
  totalLabel:          { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600' },
  totalMonto:          { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 4 },
  totalSub:            { fontSize: 12, color: colors.textSecondary, marginTop: 4, flex: 1 },
  card:                { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  avatar:              { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary + '33', borderWidth: 1, borderColor: colors.primary + '55', justifyContent: 'center', alignItems: 'center' },
  avatarText:          { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  nombre:              { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cargo:               { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  infoRow:             { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  infoText:            { fontSize: 11, color: colors.textMuted },
  cardRight:           { alignItems: 'flex-end', gap: 6 },
  diasBadge:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  diasBadgeText:       { fontSize: 12, fontWeight: '700' },
  subtotal:            { fontSize: 14, fontWeight: 'bold', color: colors.success },
  vacio:               { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:           { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:            { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  btnCompartirFull:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 10, padding: 16, marginTop: 20 },
  btnCompartirFullText:{ color: colors.textDark, fontWeight: 'bold', fontSize: 15 },
});
