// Este archivo reemplaza (o complementa) tu app.json existente.
// Si ya tienes un app.json con configuración de nombre/ícono/splash,
// copia ese contenido dentro de module.exports de aquí abajo (bajo la
// misma estructura), o renombra este archivo y fusiona ambos — Expo
// solo permite uno de los dos activo a la vez.
//
// Requiere el paquete "dotenv": npm install dotenv --save-dev
require('dotenv').config();

module.exports = {
  expo: {
    name: 'Control Obra',
    slug: 'control-obra',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    // ...pega aquí el resto de tu configuración actual de app.json
    // (icon, splash, android, ios, plugins, etc.)

    extra: {
      firebaseApiKey:           process.env.FIREBASE_API_KEY,
      firebaseAuthDomain:       process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId:        process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket:    process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId:process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId:            process.env.FIREBASE_APP_ID,
    },
  },
};
