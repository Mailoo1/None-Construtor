import * as SQLite from 'expo-sqlite';
import { logInfo } from '../utils/logger';

const db = SQLite.openDatabaseSync('control_obra.db');

// ─────────────────────────────────────────────────────────────────────────
// FIX (bug de "ids duplicados" / warning de keys en las listas):
//
// Antes, firebase_id NO tenía restricción UNIQUE, así que
// "INSERT OR REPLACE" nunca encontraba conflicto y sencillamente
// insertaba una fila nueva cada vez que se sincronizaba una tarea/
// material/persona. Con el tiempo, un mismo registro de Firestore
// terminaba duplicado varias veces en SQLite. Cuando el usuario
// entraba sin internet, esas filas duplicadas (mismo firebase_id)
// se usaban como "id" en el FlatList → React encontraba dos hijos
// con la misma key.
//
// La solución tiene dos partes:
//   1. Agregar UNIQUE a firebase_id en las 3 tablas.
//   2. Migrar instalaciones existentes: si la tabla ya existe sin
//      UNIQUE, se recrea limpiando duplicados (se conserva la fila
//      más reciente por firebase_id).
// ─────────────────────────────────────────────────────────────────────────

const TABLAS = [
  {
    nombre: 'tareas_local',
    columnas: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_id TEXT UNIQUE,
      uid TEXT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      prioridad TEXT DEFAULT 'media',
      estado TEXT DEFAULT 'pendiente',
      evidencia TEXT,
      creado_en TEXT
    `,
  },
  {
    nombre: 'materiales_local',
    columnas: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_id TEXT UNIQUE,
      uid TEXT,
      material TEXT NOT NULL,
      cantidad TEXT,
      proveedor TEXT,
      recibio TEXT,
      notas TEXT,
      fecha_str TEXT,
      hora_str TEXT,
      creado_en TEXT
    `,
  },
  {
    nombre: 'personal_local',
    columnas: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_id TEXT UNIQUE,
      uid TEXT,
      nombre TEXT NOT NULL,
      cargo TEXT,
      telefono TEXT,
      precio_dia REAL DEFAULT 0,
      estado TEXT DEFAULT 'activo',
      creado_en TEXT
    `,
  },
];

// Revisa si la tabla existente tiene UNIQUE en firebase_id. Si no lo
// tiene (instalación vieja), la migra: crea una tabla nueva con el
// esquema correcto, copia los datos quedándose con la fila más
// reciente por firebase_id, borra la vieja y renombra.
const migrarSiHaceFalta = (nombre, columnas) => {
  const existe = db.getAllSync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
    [nombre]
  );
  if (existe.length === 0) return; // no existe aún, CREATE TABLE de abajo la crea limpia

  const sql = db.getAllSync(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name = ?`,
    [nombre]
  );
  const yaTieneUnique = sql[0]?.sql?.includes('firebase_id TEXT UNIQUE');
  if (yaTieneUnique) return; // ya migrada

  logInfo(`Migrando tabla ${nombre} (agregando UNIQUE a firebase_id, limpiando duplicados)...`);

  db.execSync(`CREATE TABLE ${nombre}_nueva (${columnas});`);

  // Nos quedamos con la fila de mayor id (la más reciente) por cada
  // firebase_id repetido; las filas con firebase_id NULL (creadas
  // offline y aún no sincronizadas) se conservan todas.
  const columnasNombres = columnas
    .split(',')
    .map(c => c.trim().split(/\s+/)[0])
    .filter(c => c !== 'id');

  db.execSync(`
    INSERT INTO ${nombre}_nueva (${columnasNombres.join(', ')})
    SELECT ${columnasNombres.join(', ')} FROM ${nombre}
    WHERE firebase_id IS NULL
       OR id IN (
         SELECT MAX(id) FROM ${nombre}
         WHERE firebase_id IS NOT NULL
         GROUP BY firebase_id
       );
  `);

  db.execSync(`DROP TABLE ${nombre};`);
  db.execSync(`ALTER TABLE ${nombre}_nueva RENAME TO ${nombre};`);
};

export const inicializarDB = () => {
  for (const tabla of TABLAS) {
    migrarSiHaceFalta(tabla.nombre, tabla.columnas);
    db.execSync(`CREATE TABLE IF NOT EXISTS ${tabla.nombre} (${tabla.columnas});`);
  }

  // Migración de columnas sueltas que ya existían antes de este fix
  // (se mantienen por compatibilidad con instalaciones muy viejas).
  try { db.execSync(`ALTER TABLE tareas_local ADD COLUMN evidencia TEXT;`); }
  catch (e) { logInfo('La columna evidencia ya existe'); }

  try { db.execSync(`ALTER TABLE personal_local ADD COLUMN precio_dia REAL DEFAULT 0;`); }
  catch (e) { logInfo('La columna precio_dia ya existe'); }
};

// ── TAREAS ────────────────────────────────────────────────────────────────────
export const guardarTareaLocal = (tarea) => {
  // ON CONFLICT + UNIQUE = upsert real: si firebase_id ya existe, actualiza
  // esa misma fila en vez de crear una nueva (esto es lo que arregla el bug).
  db.runSync(
    `INSERT INTO tareas_local
     (firebase_id, uid, titulo, descripcion, prioridad, estado, creado_en, evidencia)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(firebase_id) DO UPDATE SET
       uid = excluded.uid,
       titulo = excluded.titulo,
       descripcion = excluded.descripcion,
       prioridad = excluded.prioridad,
       estado = excluded.estado,
       creado_en = excluded.creado_en,
       evidencia = excluded.evidencia`,
    [tarea.id, tarea.uid, tarea.titulo, tarea.descripcion,
     tarea.prioridad, tarea.estado, tarea.creadoEn, tarea.evidencia || null]
  );
};

export const obtenerTareasLocal = (uid) => {
  return db.getAllSync(
    'SELECT * FROM tareas_local WHERE uid = ? ORDER BY id DESC', [uid]
  );
};

export const actualizarEstadoTareaLocal = (firebaseId, estado, evidencia = null) => {
  db.runSync(
    `UPDATE tareas_local SET estado = ?, evidencia = ? WHERE firebase_id = ?`,
    [estado, evidencia, firebaseId]
  );
};

export const eliminarTareaLocal = (firebaseId) => {
  db.runSync('DELETE FROM tareas_local WHERE firebase_id = ?', [firebaseId]);
};

// ── MATERIALES ────────────────────────────────────────────────────────────────
export const guardarMaterialLocal = (material) => {
  db.runSync(
    `INSERT INTO materiales_local
     (firebase_id, uid, material, cantidad, proveedor, recibio, notas, fecha_str, hora_str, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(firebase_id) DO UPDATE SET
       uid = excluded.uid,
       material = excluded.material,
       cantidad = excluded.cantidad,
       proveedor = excluded.proveedor,
       recibio = excluded.recibio,
       notas = excluded.notas,
       fecha_str = excluded.fecha_str,
       hora_str = excluded.hora_str,
       creado_en = excluded.creado_en`,
    [material.id, material.uid, material.material, material.cantidad,
     material.proveedor, material.recibio, material.notas,
     material.fechaStr, material.horaStr, material.fecha]
  );
};

export const obtenerMaterialesLocal = (uid) => {
  return db.getAllSync(
    'SELECT * FROM materiales_local WHERE uid = ? ORDER BY id DESC', [uid]
  );
};

export const eliminarMaterialLocal = (firebaseId) => {
  db.runSync('DELETE FROM materiales_local WHERE firebase_id = ?', [firebaseId]);
};

// ── PERSONAL ──────────────────────────────────────────────────────────────────
export const guardarPersonalLocal = (persona) => {
  db.runSync(
    `INSERT INTO personal_local
     (firebase_id, uid, nombre, cargo, telefono, precio_dia, estado, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(firebase_id) DO UPDATE SET
       uid = excluded.uid,
       nombre = excluded.nombre,
       cargo = excluded.cargo,
       telefono = excluded.telefono,
       precio_dia = excluded.precio_dia,
       estado = excluded.estado,
       creado_en = excluded.creado_en`,
    [persona.id, persona.uid, persona.nombre, persona.cargo,
     persona.telefono, persona.precioDia ?? 0, persona.estado, persona.creadoEn]
  );
};

export const obtenerPersonalLocal = (uid) => {
  return db.getAllSync(
    'SELECT * FROM personal_local WHERE uid = ? ORDER BY id DESC', [uid]
  );
};

export const eliminarPersonalLocal = (firebaseId) => {
  db.runSync('DELETE FROM personal_local WHERE firebase_id = ?', [firebaseId]);
};

export default db;
