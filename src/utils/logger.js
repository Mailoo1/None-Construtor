// Logger simple: en producción (build de release) __DEV__ es false,
// así que estos logs no quedan corriendo ni consumiendo recursos
// en el teléfono del usuario final.
export const logInfo = (...args) => {
  if (__DEV__) console.log(...args);
};

export const logError = (...args) => {
  if (__DEV__) console.error(...args);
};
