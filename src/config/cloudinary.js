// NOTA: el apiSecret de Cloudinary NUNCA debe ir aquí. Este archivo corre en el
// dispositivo del usuario y cualquiera puede extraerlo del bundle de la app.
// Las subidas se hacen con "upload_preset" (sin firmar), que es lo correcto
// para apps cliente, así que no se necesita apiKey/apiSecret en absoluto.
export const CLOUDINARY_CONFIG = {
  cloudName:  'druii2qgj',
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

// ─── Subir PDF ────────────────────────────────────────────────────────────────
export const subirPDF = async (pdfUri, nombreArchivo = 'documento.pdf') => {
  const formData = new FormData();
  formData.append('file', {
    uri:  pdfUri,
    type: 'application/pdf',
    name: nombreArchivo,
  });
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('cloud_name',    CLOUDINARY_CONFIG.cloudName);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/raw/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json();
  if (data.secure_url) return data.secure_url;
  throw new Error('Error al subir PDF: ' + JSON.stringify(data));
};