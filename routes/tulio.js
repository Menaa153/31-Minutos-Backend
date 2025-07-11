const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST para guardar pregunta en la bd
router.post('/', async (req, res) => {
  const { nombre, pregunta } = req.body;

  if (!nombre || !pregunta) {
    return res.status(400).json({ error: 'Nombre y pregunta son obligatorios' });
  }

  try {
    const query = `
      INSERT INTO tulio_preguntas (nombre, pregunta)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [nombre, pregunta]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al guardar pregunta:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET obtener preguntas de la bd, las ultimas 10 segun fecha de envio
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tulio_preguntas ORDER BY fecha_envio DESC LIMIT 10');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


module.exports = router;
