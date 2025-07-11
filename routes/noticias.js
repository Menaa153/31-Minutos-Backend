const express = require('express');
const router = express.Router();
const { guardarNoticia, obtenerNoticias } = require('../models/noticiaModel');

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

module.exports = router;
