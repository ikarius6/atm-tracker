import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'atm-reports.db');
let db = null;

function getDatabase() {
  if (!db) {
    // Crear directorio data si no existe
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    
    // Crear tabla si no existe
    db.exec(`
      CREATE TABLE IF NOT EXISTS atm_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        reported_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return db;
}

export function getAllReports() {
  const database = getDatabase();
  return database.prepare('SELECT * FROM atm_reports ORDER BY timestamp DESC').all();
}

export function addReport(location, reportedBy = 'Anónimo') {
  const database = getDatabase();
  
  // Usar la zona horaria local en lugar de UTC
  // SQLite tiene funciones locales para fechas: datetime('now', 'localtime')
  const stmt = database.prepare(`
    INSERT INTO atm_reports (location, reported_by, timestamp)
    VALUES (?, ?, datetime('now', 'localtime'))
  `);
  
  const result = stmt.run(location, reportedBy);
  
  // Retornar el reporte creado
  return database.prepare('SELECT * FROM atm_reports WHERE id = ?').get(result.lastInsertRowid);
}

export function getReportsGroupedByHour() {
  const database = getDatabase();
  return database.prepare(`
    SELECT 
      strftime('%H', timestamp) as hour,
      COUNT(*) as count
    FROM atm_reports 
    WHERE timestamp >= datetime('now', '-24 hours')
    GROUP BY strftime('%H', timestamp)
    ORDER BY hour
  `).all();
}

export function getReportsGroupedByDay() {
  const database = getDatabase();
  return database.prepare(`
    SELECT 
      strftime('%Y-%m-%d', timestamp) as day,
      COUNT(*) as count
    FROM atm_reports 
    WHERE timestamp >= datetime('now', '-7 days')
    GROUP BY strftime('%Y-%m-%d', timestamp)
    ORDER BY day
  `).all();
}
