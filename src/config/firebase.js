import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FIX: la config de Firebase ya no está escrita directo en el código.
// Se lee desde variables de entorno (ver .env.example y app.config.js
// en la raíz del proyecto). Así el archivo se puede subir a un repo
// público (ej. para mostrarlo en el portafolio) sin exponer tus llaves.
//
// La apiKey de Firebase no es "secreta" en el sentido estricto (viaja
// igual dentro del bundle de cualquier app compilada), pero sacarla
// del código es buena práctica y además te obliga a tener Firestore
// Security Rules correctas, que es lo que de verdad protege tus datos.
const firebaseConfig = {
  apiKey:            Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain:         Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId:          Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket:      Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId:  Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId:              Constants.expoConfig?.extra?.firebaseAppId,
};

if (__DEV__ && !firebaseConfig.apiKey) {
  console.warn(
    '[firebase.js] Falta la configuración de Firebase. ' +
    'Revisa que tengas un archivo .env con las variables FIREBASE_* ' +
    '(mira .env.example) y que app.config.js las esté leyendo.'
  );
}

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
