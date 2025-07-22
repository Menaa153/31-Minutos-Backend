const express = require('express');
const router = express.Router();
const { guardarNoticia, obtenerNoticias } = require('../models/noticiaModel');
const pool = require('../config/db');


router.post('/', async (req, res) => {
  const { titulo, contenido } = req.body;
  try {
    const noticia = await guardarNoticia(titulo, contenido);
    res.status(201).json(noticia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la noticia' });
  }
});

router.get('/', async (req, res) => {
  try {
    const noticias = await obtenerNoticias();
    res.json(noticias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener noticias' });
  }
});

router.get('/recientes-combinadas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        n.titulo, 
        n.nombre_reportero, 
        n.categoria_noticia AS categoria, 
        n.creado_en AS fecha
      FROM noticias n

      UNION ALL

      SELECT 
        np.titulo, 
        r.nombre AS nombre_reportero, 
        NULL AS categoria, 
        np.fecha_creacion AS fecha
      FROM noticias_pasantes np
      JOIN reporteros_pasantes r ON r.id = np.reportero_id

      ORDER BY fecha DESC
      LIMIT 5;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al combinar noticias:', error.message);
    res.status(500).json({ error: 'Error al obtener noticias recientes combinadas' });
  }
});

router.get('/estadisticas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM noticias) +
        (SELECT COUNT(*) FROM noticias_pasantes) AS total_noticias,
        GREATEST(
          (SELECT COALESCE(MAX(like_count), 0) FROM noticias),
          (SELECT COALESCE(MAX(likes), 0) FROM noticias_pasantes)
        ) AS noticia_mas_popular
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error.message);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});




module.exports = router;
