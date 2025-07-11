const express = require('express');
const axios = require('axios');
const router = express.Router();
const pool = require('../config/db');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CATEGORIA = 'ultima';

const prompt = `Crea 6 noticias de última hora, 3 en tono satírico o ridículo como si fueran parte de un noticiero
  de humor y las otras 3 que sean de la realidad y lo mas actual posible. Cada noticia debe tener un titulo llamativo,
  un contenido breve y una categoria que indique el tema general de la noticia (una sola palabra).
  Devuelve todo en formato JSON:
[
  {
    "titulo": "Título llamativo",
    "contenido": "Texto breve y gracioso",
    "categoria_noticia": "Política"
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
      const nombreReportero = getNombreReporteroAleatorio();
      const imagenReportero = getImagenReporteroAleatoria(nombreReportero);
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
    console.error('Error al generar noticias ultima hora:', error);
    res.status(500).json({ error: 'Error al generar noticias de ultima hora' });
  }
});


// asignar nombre aleatorio de reportero
function getNombreReporteroAleatorio() {
  const reporteros = [
    'Policarpo Avendaño', 'Tulio Triviño', 'Juanín Juan Harry',
    'Juan Carlos Bodoque', 'Mario Hugo', 'Patana Tufillo Triviño'
  ];
  return reporteros[Math.floor(Math.random() * reporteros.length)];
}

// asignar imagen aleatoria a reportero
function getImagenReporteroAleatoria(nombre) {
  const base = nombre.split(' ')[0];
  const indice = Math.floor(Math.random() * 5) + 1;
  return `public/reporteros/${base}${indice}.webp`;
}

//asignar numero de likes aleatorio entre 10 y 15
function getNumeroLikeAleatorio() {
  return Math.floor(Math.random() * 6) + 10;
}


module.exports = router;
