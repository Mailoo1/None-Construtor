# Control Obra — Registro de correcciones y buenas prácticas

Este documento explica **qué se cambió, por qué, y qué archivos tocar** para
aplicar todo esto a tu proyecto. Está pensado para que lo puedas usar como
sustento en tu evaluación ("qué mejoré y por qué") y como referencia futura.

---

## 1. 🐛 Bug crítico: IDs duplicados en las listas (el error de Expo Go)

**Síntoma:** al usar la app sin internet, React mostraba el warning
*"Encountered two children with the same key"* y las listas (Tareas,
Materiales, Personal) se veían raras o duplicadas.

**Causa raíz:** en `src/config/database.js`, las tablas de SQLite
(`tareas_local`, `materiales_local`, `personal_local`) guardaban la columna
`firebase_id` **sin restricción `UNIQUE`**. El código usaba
`INSERT OR REPLACE`, que solo "reemplaza" cuando hay conflicto en una
columna `UNIQUE`/`PRIMARY KEY`. Como no existía ese conflicto, cada
sincronización **insertaba una fila nueva** en vez de actualizar la
existente. Con el tiempo, una misma tarea/material/persona terminaba
duplicada varias veces en la base local. Al perder internet, esas filas
duplicadas (mismo `firebase_id`) se usaban como `key` del `FlatList` →
React encontraba dos elementos con la misma key.

**Solución (`src/config/database.js`):**
1. Se agregó `UNIQUE` a la columna `firebase_id` en las 3 tablas.
2. Se agregó una **migración automática**: si el usuario ya tenía la app
   instalada con la tabla vieja (sin `UNIQUE`), al abrir la app una vez
   con esta versión se recrea la tabla limpiando los duplicados
   (se conserva la fila más reciente de cada `firebase_id`).
3. Se reemplazó `INSERT OR REPLACE` por
   `INSERT ... ON CONFLICT(firebase_id) DO UPDATE SET ...` — un *upsert*
   de verdad: si el registro ya existe, lo actualiza; si no, lo crea.

**Bonus encontrado en el camino:** en `PersonalScreen.js`, al crear un
trabajador nuevo, el `precioDia` se guardaba en Firestore pero **no** se
pasaba a `guardarPersonalLocal()`. Resultado: el precio por día
desaparecía en el modo offline. Ya está corregido.

---

## 2. 🔑 API key de Firebase escrita directo en el código

**Antes:** `src/config/firebase.js` tenía la configuración completa de
Firebase (incluida la `apiKey`) como texto plano en el archivo.

**Por qué importa:** si subes el repo a GitHub (por ejemplo para tu
portafolio), cualquiera puede ver esas llaves. La `apiKey` de Firebase no
es "secreta" en sentido estricto (viaja igual dentro de cualquier app
compilada), pero:
- No es buena práctica versionarla.
- Lo que **de verdad** protege tus datos son las *Firestore Security
  Rules* — vale la pena que las revises y confirmes que exigen
  `request.auth.uid == resource.data.uid` en cada colección.

**Solución:**
- `src/config/firebase.js` ahora lee la config desde
  `Constants.expoConfig.extra` (usando `expo-constants`, que ya viene con
  Expo).
- Se agregó `app.config.js` en la raíz del proyecto, que lee variables de
  entorno con `dotenv` y las expone a la app.
- Se agregó `.env.example` como plantilla. Debes copiarlo como `.env` y
  poner tus valores reales (los mismos que ya tenías en el archivo viejo,
  los sacas de Firebase Console → Configuración del proyecto).
- **Importante:** agrega `.env` a tu `.gitignore` para que no se suba.

### Pasos para activarlo en tu proyecto real
```bash
npm install dotenv --save-dev
cp .env.example .env
# edita .env y pega tus valores reales de Firebase
```
Si ya tienes un `app.json`, fusiona su contenido dentro de
`app.config.js` (Expo solo permite uno de los dos activo).

---

## 3. 🔁 35 bloques `catch` casi idénticos, mensajes de error inconsistentes

**Antes:** cada pantalla repetía su propio `Alert.alert('Error', e.message)`,
mostrando literalmente el mensaje técnico de Firebase al usuario (ej.
`"Firebase: Error (auth/network-request-failed)."`), algo que un usuario de
obra no entiende.

**Solución:** se creó `src/utils/errorHandler.js` con:
- `obtenerMensajeError(error)`: traduce códigos comunes de Firebase Auth /
  Firestore / red a mensajes en español, claros y accionables.
- `mostrarError(error, titulo)`: registra el error técnico completo en
  consola (solo en desarrollo) y muestra la alerta amigable.

Todas las pantallas (`TareasScreen`, `MaterialesScreen`, `PersonalScreen`,
`GaleriaScreen`, `ObrasScreen`, `PerfilScreen`, `RegisterScreen`,
`PlanosScreen`, `FacturacionScreen`) ahora usan `mostrarError(e, '...')` en
vez de mensajes genéricos o repetidos.

---

## 4. 👆 Doble-tap = registros duplicados

**Antes:** en varias pantallas, el botón de "Guardar" quedaba visualmente
deshabilitado mientras `loading = true`, pero la función en sí no
verificaba ese estado al inicio. Un doble-tap muy rápido (común en
pantallas táctiles, o con lag de red) podía disparar la función dos veces
antes de que el estado se actualizara, creando el registro dos veces en
Firestore.

**Solución:** se agregó un guard `if (loading) return;` (o el nombre de
estado correspondiente: `subiendo`, `subiendoFoto`, `generando`, etc.) al
inicio de cada función que crea o sube algo:
`agregarTarea`, `subirEvidencia`, `agregarRegistro`, `agregarTrabajador`,
`guardarPrecio`, `agregarObra`, `guardarPerfil`, `seleccionarFoto`,
`tomarFoto`, `subirFoto`, `guardarPlano`, `handleRegister`, `compartirPDF`.

---

## 5. 📦 Queries de Firestore sin límite

**Antes:** todas las pantallas hacían `getDocs(query(...))` trayendo
**todos** los documentos del usuario de una vez, sin límite. Con pocos
datos no se nota, pero si el proyecto crece (cientos de tareas o
materiales), esto se vuelve lento y consume más lecturas de Firestore de
las necesarias (impacta el plan gratuito de Firebase).

**Solución aplicada ahora:** se agregó `limit(N)` a las queries
principales (300 para tareas/materiales/personal/fotos, 200 para planos,
100 para obras) como salvavidas contra el peor caso.

**Próximo paso recomendado (no incluido aún, por alcance):** paginación
real con `startAfter()` + botón "cargar más", si el volumen de datos
crece mucho. Te puedo ayudar con esto cuando lo necesites.

---

## 6. 🧹 `console.log` sueltos en producción

**Antes:** ~10 `console.log` regados por el código, que en un build de
producción siguen corriendo (gastan recursos, y en release-mode Metro no
siempre los elimina).

**Solución:** se creó `src/utils/logger.js` con `logInfo()` y `logError()`,
que solo imprimen cuando `__DEV__` es `true` (o sea, en desarrollo). Todos
los `console.log` fueron reemplazados por estas funciones.

---

## 7. 🆔 ID no garantizado en NotasScreen

**Bonus encontrado:** `NotasScreen.js` generaba el id de cada nota con
`Date.now().toString()`, que solo tiene resolución de milisegundo. En la
práctica es muy difícil que choque creando notas a mano, pero no estaba
garantizado. Se cambió a `generarIdUnico()`, que combina timestamp +
sufijo aleatorio.

---

## Archivos nuevos

| Archivo | Para qué |
|---|---|
| `src/utils/logger.js` | Logs que solo corren en desarrollo |
| `src/utils/errorHandler.js` | Mensajes de error centralizados y amigables |
| `app.config.js` (raíz) | Expone variables de entorno a la app |
| `.env.example` (raíz) | Plantilla de variables de entorno (sin valores reales) |

## Archivos modificados

`src/config/database.js`, `src/config/firebase.js`, y las 11 pantallas en
`src/screens/`.

---

## Cómo probar que el fix del bug principal funciona

1. Instala esta versión sobre un dispositivo/emulador que **ya tenía** la
   app vieja instalada (para probar la migración de datos existentes).
2. Abre la app conectado a internet, navega por Tareas/Materiales/Personal
   para forzar la sincronización a SQLite.
3. Activa modo avión y vuelve a entrar a esas pantallas — no debería
   aparecer el warning de keys duplicadas, y cada registro debería
   aparecer una sola vez.
4. Para probar en limpio: desinstala la app, instala esta versión, crea
   datos, sal de internet — mismo resultado esperado.
