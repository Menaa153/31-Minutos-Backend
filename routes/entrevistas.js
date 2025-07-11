const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET de las entrevistas
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM entrevistas ORDER BY fecha DESC');
    const ingeniosas = rows.filter(e => e.tipo === 'ingeniosas');
    const extravagantes = rows.filter(e => e.tipo === 'extravagantes');
    res.json({ ingeniosas, extravagantes });
  } catch (error) {
    console.error('Error al obtener entrevistas:', error.message);
    res.status(500).json({ error: 'Error al obtener entrevistas' });
  }
});

// POST para agregar una nueva entrevista desde el frotend con el formulario
router.post('/', async (req, res) => {
  const {
    tipo,
    fecha,
    titulo,
    pregunta,
    respuesta,
    autor,
    imagen
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO entrevistas (
        id, tipo, fecha, titulo, pregunta, respuesta, autor, imagen, creado_en
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now()
      )`,
      [tipo, fecha, titulo, pregunta, respuesta, autor, imagen]
    );

    res.status(201).json({ mensaje: 'Entrevista agregada correctamente' });
  } catch (error) {
    console.error('Error al insertar entrevista:', error.message);
    res.status(500).json({ error: 'Error al insertar entrevista' });
  }
});

module.exports = router;
