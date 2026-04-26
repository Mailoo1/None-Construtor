export const CLOUDINARY_CONFIG = {
  cloudName:  'druii2qgj',
  apiKey:     '252296978478384',
  apiSecret:  'wyKwzrEL7S2eB58GAUSXpWJCi8c',
  uploadPreset: 'control_obra',
};

export const subirImagen = async (imagenUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri:  imagenUri,
    type: 'image/jpeg',
    name: 'foto.jpg',
  });
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('cloud_name',    CLOUDINARY_CONFIG.cloudName);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (data.secure_url) return data.secure_url;
  throw new Error('Error al subir imagen');
};