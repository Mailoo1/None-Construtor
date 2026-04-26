import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAzbeVthNkulffH5hN9JKCjaBJqAqnOh1U",
  authDomain: "control-obra-6fff9.firebaseapp.com",
  projectId: "control-obra-6fff9",
  storageBucket: "control-obra-6fff9.firebasestorage.app",
  messagingSenderId: "169636759980",
  appId: "1:169636759980:web:c6e03ebf5d54d065021209",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);