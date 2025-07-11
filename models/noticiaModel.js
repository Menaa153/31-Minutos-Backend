const db = require('../config/db');

// Comillas dobles para nombres con guiones
async function guardarNoticia(titulo, contenido) {
  const query = 'INSERT INTO "noti-prueba" (titulo, contenido) VALUES ($1, $2) RETURNING *';
  const values = [titulo, contenido];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function obtenerNoticias() {
  const query = 'SELECT * FROM "noti-prueba" ORDER BY titulo';
  const result = await db.query(query);
  return result.rows;
}

module.exports = { guardarNoticia, obtenerNoticias };
