import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView, Linking, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { colors } from '../config/theme';
import { subirImagen, subirPDF } from '../config/cloudinary';

const tipoConfig = {
  PDF: { icon: 'document-text-outline', color: colors.danger },
  IMG: { icon: 'image-outline',         color: colors.info   },
};

export default function PlanosScreen() {
  const [planos,       setPlanos]       = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre,       setNombre]       = useState('');
  const [archivoSel,   setArchivoSel]   = useState(null);
  const [subiendo,     setSubiendo]     = useState(false);

  useEffect(() => { cargarPlanos(); }, []);

  const cargarPlanos = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      const q    = query(collection(db, 'planos'), where('uid', '==', uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setPlanos(data);
    } catch (e) { console.log(e); }
  };

  const elegirImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setArchivoSel({ uri: asset.uri, tipo: 'IMG', nombre: asset.fileName ?? 'imagen.jpg' });
    }
  };

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setArchivoSel({ uri: asset.uri, tipo: 'IMG', nombre: 'foto_plano.jpg' });
    }
  };

  // PDF: el usuario lo elige desde galería como imagen, o se sube directamente
  // como no tenemos expo-document-picker, usamos ImagePicker con todos los tipos
  const elegirPDF = async () => {
    Alert.alert(
      'Subir PDF',
      'Para subir un PDF, comparte el archivo desde tu gestor de archivos y selecciona esta app, o convierte el PDF a imagen (captura de pantalla).\n\nPor ahora puedes subir la imagen del plano.',
      [
        { text: 'Subir imagen', onPress: elegirImagen },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const guardarPlano = async () => {
    if (!nombre.trim()) { Alert.alert('Campo requerido', 'Escribe un nombre para el plano.'); return; }
    if (!archivoSel)    { Alert.alert('Archivo requerido', 'Selecciona una imagen.'); return; }
    try {
      setSubiendo(true);
      const uid = auth.currentUser?.uid;
      const url = await subirImagen(archivoSel.uri);
      await addDoc(collection(db, 'planos'), {
        uid,
        nombre:   nombre.trim(),
        tipo:     archivoSel.tipo,
        url,
        fecha:    new Date().toISOString(),
        fechaStr: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
      });
      setNombre(''); setArchivoSel(null);
      setModalVisible(false);
      cargarPlanos();
    } catch (e) {
      Alert.alert('Error al subir', e.message);
    } finally { setSubiendo(false); }
  };

  const eliminarPlano = (id) => {
    Alert.alert('Eliminar plano', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'planos', id));
        cargarPlanos();
      }},
    ]);
  };

  const abrirArchivo = (item) => {
    if (item.url) Linking.openURL(item.url);
  };

  return (
    <View style={s.container}>
      <FlatList
        data={planos}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            <View style={s.headerRow}>
              <Text style={s.titulo}>Planos</Text>
              <TouchableOpacity style={s.btnAdd} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            <View style={s.resumen}>
              <View style={s.resumenItem}>
                <Text style={s.resumenNum}>{planos.length}</Text>
                <Text style={s.resumenLabel}>Total</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.danger }]}>{planos.filter(p => p.tipo === 'PDF').length}</Text>
                <Text style={s.resumenLabel}>PDFs</Text>
              </View>
              <View style={s.divider} />
              <View style={s.resumenItem}>
                <Text style={[s.resumenNum, { color: colors.info }]}>{planos.filter(p => p.tipo === 'IMG').length}</Text>
                <Text style={s.resumenLabel}>Imágenes</Text>
              </View>
            </View>
            <Text style={s.seccionLabel}>ARCHIVOS</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => abrirArchivo(item)} activeOpacity={0.75}>
            <View style={[s.iconBox, {
              backgroundColor: tipoConfig[item.tipo]?.color + '22',
              borderColor:     tipoConfig[item.tipo]?.color + '55',
            }]}>
              {item.tipo === 'IMG' && item.url
                ? <Image source={{ uri: item.url }} style={s.thumb} />
                : <Ionicons name={tipoConfig[item.tipo]?.icon ?? 'document-outline'} size={26} color={tipoConfig[item.tipo]?.color ?? colors.primary} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{item.nombre}</Text>
              <Text style={s.detalle}>{item.fechaStr} · {item.tipo}</Text>
              <View style={s.abrirRow}>
                <Ionicons name="open-outline" size={11} color={colors.textMuted} />
                <Text style={s.abrirText}>Toca para abrir</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => eliminarPlano(item.id)} style={s.btnEliminar}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
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

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView style={s.modalBox} contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Agregar plano</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setArchivoSel(null); setNombre(''); }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Nombre del plano *</Text>
            <TextInput style={s.input} placeholder="Ej: Plano estructural piso 1"
              placeholderTextColor={colors.textMuted} value={nombre} onChangeText={setNombre} />

            <Text style={s.label}>Archivo *</Text>
            {archivoSel && (
              <View style={s.preview}>
                <Ionicons name="image-outline" size={22} color={colors.info} />
                <Text style={s.previewNombre} numberOfLines={1}>{archivoSel.nombre}</Text>
                <TouchableOpacity onPress={() => setArchivoSel(null)}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            <View style={s.archivoBtns}>
              <TouchableOpacity style={s.archivoBtn} onPress={tomarFoto}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={s.archivoBtnText}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.archivoBtn} onPress={elegirImagen}>
                <Ionicons name="image-outline" size={20} color={colors.info} />
                <Text style={s.archivoBtnText}>Galería</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[s.btnGuardar, subiendo && { opacity: 0.6 }]}
              onPress={guardarPlano} disabled={subiendo}>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.textDark} />
              <Text style={s.btnGuardarText}>{subiendo ? 'Subiendo...' : 'Guardar plano'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bgPrimary },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:         { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  btnAdd:         { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  resumen:        { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-around' },
  resumenItem:    { alignItems: 'center' },
  resumenNum:     { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  resumenLabel:   { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  divider:        { width: 1, backgroundColor: colors.border },
  seccionLabel:   { fontSize: 11, color: colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card:           { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  iconBox:        { width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  thumb:          { width: 52, height: 52, borderRadius: 10 },
  nombre:         { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  detalle:        { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  abrirRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  abrirText:      { fontSize: 11, color: colors.textMuted },
  btnEliminar:    { padding: 8 },
  vacio:          { alignItems: 'center', paddingVertical: 60, gap: 8 },
  vacioText:      { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:       { fontSize: 13, color: colors.textMuted },
  modalOverlay:   { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%', borderWidth: 1, borderColor: colors.border },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:    { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  label:          { fontSize: 12, color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:          { backgroundColor: colors.bgContainer, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, marginBottom: 14 },
  preview:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgContainer, borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  previewNombre:  { flex: 1, fontSize: 13, color: colors.textPrimary },
  archivoBtns:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  archivoBtn:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.bgContainer, borderRadius: 10, paddingVertical: 14, borderWidth: 1, borderColor: colors.border },
  archivoBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  btnGuardar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 8, padding: 16 },
  btnGuardarText: { color: colors.textDark, fontWeight: 'bold', fontSize: 16 },
});
