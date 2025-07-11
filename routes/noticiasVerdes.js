const express = require('express');
const axios = require('axios');
const router = express.Router();
const pool = require('../config/db');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CATEGORIA = 'verde';

const prompt = `Escribe 10 notas verdes divertidas relacionadas con la naturaleza, el medio ambiente o los animales,
de la cual 5 de ellas qeu tengan un estilo de un noticiero infantil absurdo, usa humor y creatividad, las otras 5
deben ser noticias reales y actuales sobre temas ecológicos.
Cada entrada debe tener un título, un contenido breve y una categoria de la noticia (una sola palabra).
Devuelve en formato JSON:
[
  {
    "titulo": "Título ecológico",
    "contenido": "Texto corto"
    "categoria_noticia": "Fauna"
  }
]`;

router.get('/', async (req, res) => {
  try {
    //obtener la fecha en la zona horaria de Colombia
    const hoyColombia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

    //verificar si ya existen noticias para hoy
    const { rows } = await pool.query(
      'SELECT * FROM deportes WHERE fecha_publicacion = $1',
      [hoyColombia]
    );

    if (rows.length > 0) return res.json(rows);

    //borrar noticias anteriores
    await pool.query(
      'DELETE FROM deportes WHERE fecha_publicacion < $1',
      [hoyColombia]
    );

    //generar nuevas noticias con la API de Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const texto = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const json = JSON.parse(texto.slice(texto.indexOf('['), texto.lastIndexOf(']') + 1));

    //insertar las noticias en la base de datos
    const insertQuery = `
      INSERT INTO noticias (
        id, titulo, nombre_reportero, imagen_reportero,
        texto_noticia, categoria, categoria_noticia, like_count,
        fecha_publicacion, creado_en
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, now())
    `;

    for (const noticia of json) {
      const nombreReportero = 'Juan Carlos Bodoque';
      const imagenReportero = getImagenReporteroAleatoria();
      const likeCount = getNumeroLikeAleatorio();

      await pool.query(insertQuery, [
        noticia.titulo,
        nombreReportero,
        imagenReportero,
        noticia.contenido,
        CATEGORIA,
        noticia.categoria_noticia,
        likeCount,
        hoyColombia
      ]);
    }

    //insertar las noticias en la base de datos
    const { rows: nuevasNoticias } = await pool.query(
      'SELECT * FROM noticias WHERE fecha_publicacion = $1 AND categoria = $2',
      [hoyColombia, CATEGORIA]
    );

    res.json(nuevasNoticias);
  } catch (error) {
    console.error('Error al generar noticias verdes:', error);
    res.status(500).json({ error: 'Error al generar noticias verdes' });
  }
});

//asignar numero de likes aleatorio entre 10 y 15
function getNumeroLikeAleatorio() {
  return Math.floor(Math.random() * 6) + 10;
}

//como solo Juan Bodoque es reportero de noticias verdes, no es necesario asignar un nombre aleatorio
// solo asignamos una imagen aleatoria
function getImagenReporteroAleatoria() {
  const base = "Juan"
  const indice = Math.floor(Math.random() * 5) + 1;
  return `reporteros/${base}${indice}.webp`;
}


module.exports = router;
