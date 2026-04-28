import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { subirImagen } from '../config/cloudinary';
import { colors } from '../config/theme';

const { width } = Dimensions.get('window');
const FOTO_SIZE = (width - 48) / 3;

export default function GaleriaScreen() {
  const [fotos,        setFotos]        = useState([]);
  const [subiendo,     setSubiendo]     = useState(false);
  const [fotoSelec,    setFotoSelec]    = useState(null);

  useEffect(() => { cargarFotos(); }, []);

  const cargarFotos = async () => {
    try {
      const uid  = auth.currentUser?.uid;
      const q    = query(collection(db, 'galeria'), where('uid', '==', uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setFotos(data);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const subirFoto = async (uri) => {
    try {
      setSubiendo(true);
      const url = await subirImagen(uri);
      const uid = auth.currentUser?.uid;
      await addDoc(collection(db, 'galeria'), {
        uid, url,
        fecha:    new Date().toISOString(),
        fechaStr: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
        horaStr:  new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      });
      cargarFotos();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSubiendo(false); }
  };

  const tomarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.'); return; }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!resultado.canceled) await subirFoto(resultado.assets[0].uri);
  };

  const seleccionarFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.'); return; }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!resultado.canceled) {
      for (const asset of resultado.assets) {
        await subirFoto(asset.uri);
      }
    }
  };

  const opcionesSubir = () => {
    Alert.alert('Agregar foto', '¿Cómo quieres agregar la foto?', [
      { text: 'Cancelar',      style: 'cancel'         },
      { text: '📷 Tomar foto', onPress: tomarFoto      },
      { text: '🖼️ Galería',    onPress: seleccionarFoto },
    ]);
  };

  const eliminarFoto = (id) => {
    Alert.alert('Eliminar foto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'galeria', id));
        setFotoSelec(null);
        cargarFotos();
      }},
    ]);
  };

  return (
    <View style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.titulo}>Galería</Text>
          <Text style={s.subtitulo}>{fotos.length} fotos de la obra</Text>
        </View>
        <TouchableOpacity style={s.btnAdd} onPress={opcionesSubir} activeOpacity={0.8}>
          <Ionicons name="camera" size={20} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Subiendo indicador */}
      {subiendo && (
        <View style={s.subiendoBanner}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={s.subiendoText}>Subiendo foto a Cloudinary...</Text>
        </View>
      )}

      {/* Grid de fotos */}
      {fotos.length === 0 && !subiendo ? (
        <View style={s.vacio}>
          <Ionicons name="images-outline" size={56} color={colors.textMuted} />
          <Text style={s.vacioText}>Sin fotos aún</Text>
          <Text style={s.vacioSub}>Toma fotos de la obra como evidencia del trabajo</Text>
          <TouchableOpacity style={s.btnVacioAdd} onPress={opcionesSubir}>
            <Ionicons name="camera" size={18} color={colors.textDark} />
            <Text style={s.btnVacioAddText}>Agregar primera foto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={fotos}
          keyExtractor={i => i.id}
          numColumns={3}
          contentContainerStyle={s.grid}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setFotoSelec(item)} activeOpacity={0.8}>
              <Image source={{ uri: item.url }} style={s.foto} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal foto ampliada */}
      <Modal visible={!!fotoSelec} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalCerrar} onPress={() => setFotoSelec(null)}>
            <Ionicons name="close-circle" size={36} color={colors.textPrimary} />
          </TouchableOpacity>
          {fotoSelec && (
            <>
              <Image source={{ uri: fotoSelec.url }} style={s.fotoAmpliada} resizeMode="contain" />
              <View style={s.fotoInfo}>
                <Text style={s.fotoFecha}>{fotoSelec.fechaStr} · {fotoSelec.horaStr}</Text>
                <TouchableOpacity style={s.btnEliminar} onPress={() => eliminarFoto(fotoSelec.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.textDark} />
                  <Text style={s.btnEliminarText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bgPrimary },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12 },
  titulo:         { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  subtitulo:      { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  btnAdd:         { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  subiendoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primary + '22', padding: 12, marginHorizontal: 16, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.primary + '44' },
  subiendoText:   { fontSize: 13, color: colors.primary, fontWeight: '600' },
  grid:           { padding: 16, gap: 4 },
  foto:           { width: FOTO_SIZE, height: FOTO_SIZE, borderRadius: 6, margin: 2, backgroundColor: colors.bgCard },
  vacio:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  vacioText:      { fontSize: 18, color: colors.textSecondary, fontWeight: '600' },
  vacioSub:       { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  btnVacioAdd:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  btnVacioAddText:{ color: colors.textDark, fontWeight: 'bold', fontSize: 14 },
  modalOverlay:   { flex: 1, backgroundColor: '#000000EE', justifyContent: 'center', alignItems: 'center' },
  modalCerrar:    { position: 'absolute', top: 50, right: 16, zIndex: 10 },
  fotoAmpliada:   { width: width, height: width, borderRadius: 4 },
  fotoInfo:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20, paddingTop: 16 },
  fotoFecha:      { fontSize: 13, color: colors.textSecondary },
  btnEliminar:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.danger, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnEliminarText:{ color: colors.textDark, fontWeight: 'bold', fontSize: 13 },
});