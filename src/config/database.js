import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('control_obra.db');

export const inicializarDB = () => {

  db.execSync(`
    CREATE TABLE IF NOT EXISTS tareas_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_id TEXT,
      uid TEXT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      prioridad TEXT DEFAULT 'media',
      estado TEXT DEFAULT 'pendiente',
      evidencia TEXT,
      creado_en TEXT
    );
  `);

  // Agregar columna evidencia si no existe
  try {
    db.execSync(`ALTER TABLE tareas_local ADD COLUMN evidencia TEXT;`);
  } catch (e) {
    console.log('La columna evidencia ya existe');
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS materiales_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_id TEXT,
      uid TEXT,
      material TEXT NOT NULL,
      cantidad TEXT,
      proveedor TEXT,
      recibio TEXT,
      notas TEXT,
      fecha_str TEXT,
      hora_str TEXT,
      creado_en TEXT
    );

    CREATE TABLE IF NOT EXISTS personal_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_id TEXT,
      uid TEXT,
      nombre TEXT NOT NULL,
      cargo TEXT,
      telefono TEXT,
      precio_dia REAL DEFAULT 0,
      estado TEXT DEFAULT 'activo',
      creado_en TEXT
    );
  `);

  // Agregar columna precio_dia si no existe (para usuarios que ya tienen la DB vieja)
  try {
    db.execSync(`ALTER TABLE personal_local ADD COLUMN precio_dia REAL DEFAULT 0;`);
  } catch (e) {
    console.log('La columna precio_dia ya existe');
  }
};

// ── TAREAS ────────────────────────────────────────────────────────────────────
export const guardarTareaLocal = (tarea) => {
  db.runSync(
    `INSERT OR REPLACE INTO tareas_local
     (firebase_id, uid, titulo, descripcion, prioridad, estado, creado_en, evidencia)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
    `INSERT OR REPLACE INTO materiales_local
     (firebase_id, uid, material, cantidad, proveedor, recibio, notas, fecha_str, hora_str, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    `INSERT OR REPLACE INTO personal_local
     (firebase_id, uid, nombre, cargo, telefono, precio_dia, estado, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
