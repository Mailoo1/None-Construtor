import { Alert } from 'react-native';
import { logError } from './logger';

// Traduce códigos de error comunes de Firebase (Auth + Firestore) y de red
// a mensajes que un usuario de la obra realmente entiende.
const MENSAJES = {
  'auth/invalid-email':          'El correo ingresado no tiene un formato válido.',
  'auth/user-not-found':         'Correo o contraseña incorrectos.',
  'auth/wrong-password':         'Correo o contraseña incorrectos.',
  'auth/invalid-credential':     'Correo o contraseña incorrectos.',
  'auth/email-already-in-use':   'Ya existe una cuenta registrada con ese correo.',
  'auth/weak-password':          'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests':      'Demasiados intentos. Tu cuenta fue bloqueada temporalmente por seguridad.',
  'auth/network-request-failed': 'Sin conexión a internet. Revisa tu red e intenta de nuevo.',
  'auth/user-disabled':          'Esta cuenta ha sido desactivada. Contacta al administrador.',
  'permission-denied':           'No tienes permiso para hacer esta acción.',
  'unavailable':                 'No hay conexión con el servidor. Intenta de nuevo en un momento.',
};

/**
 * Devuelve un mensaje amigable para mostrarle al usuario a partir de
 * cualquier error (Firebase, red, o error genérico de JS).
 */
export const obtenerMensajeError = (error) => {
  const codigo = error?.code || '';
  if (MENSAJES[codigo]) return MENSAJES[codigo];
  if (codigo.includes('network')) return 'Sin conexión a internet. Revisa tu red e intenta de nuevo.';
  return 'Ocurrió un problema inesperado. Intenta de nuevo en un momento.';
};

/**
 * Registra el error técnico completo en consola (solo en dev) y muestra
 * una alerta amigable al usuario. Úsalo en cualquier catch(e) de la app:
 *
 *   } catch (e) { mostrarError(e, 'No se pudo guardar la tarea'); }
 */
export const mostrarError = (error, titulo = 'Algo salió mal') => {
  logError(titulo, error);
  Alert.alert(titulo, obtenerMensajeError(error), [{ text: 'Entendido' }]);
};
