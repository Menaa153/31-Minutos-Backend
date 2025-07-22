const express = require('express');
const router = express.Router();
const pool = require('../config/db');


router.post('/crear', async (req, res) => {
  const { titulo, contenido, reportero_id } = req.body;

  if (!titulo || !contenido || !reportero_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO noticias_pasantes 
        (titulo, contenido, reportero_id) 
       VALUES ($1, $2, $3)
       RETURNING *`,
      [titulo, contenido, reportero_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear noticia:', error.message);
    res.status(500).json({ error: 'Error al crear noticia' });
  }
});


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, r.nombre AS nombre_reportero
      FROM noticias_pasantes n
      JOIN reporteros_pasantes r ON r.id = n.reportero_id
      ORDER BY n.fecha_creacion DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener noticias:', error.message);
    res.status(500).json({ error: 'Error al obtener noticias' });
  }
});




module.exports = router;
