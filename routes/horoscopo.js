const express = require('express');
const axios = require('axios');
const router = express.Router();
const pool = require('../config/db');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//obtener la fecha en la zona horaria de Colombia
const getFechaColombia = () => {
  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  return date; // formato YYYY-MM-DD
};

const prompt = `Dame el horóscopo de la semana para cada signo del zodiaco, en un tono breve y divertido.
Devuélvelo en formato JSON con los nombres de los signos como claves. Ejemplo: {
  "Aries": "texto divertido",
  "Tauro": "texto divertido",
  ...
}`;

router.get('/', async (req, res) => {
  try {
    const hoyColombia = getFechaColombia();

    //verificamos si ya hay horoscopos de hoy
    const { rows } = await pool.query(
      'SELECT signo, contenido FROM horoscopos WHERE fecha = $1',
      [hoyColombia]
    );

    if (rows.length === 12) {
      const resultado = {};
      for (const row of rows) {
        resultado[row.signo] = row.contenido;
      }
      return res.json(resultado);
    }

    //eliminamos horoscopos anteriores
    await pool.query('DELETE FROM horoscopos WHERE fecha < $1', [hoyColombia]);

    //llamamos la API de Gemini
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const texto = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const start = texto.indexOf('{');
    const end = texto.lastIndexOf('}');
    const posibleJSON = texto.slice(start, end + 1);
    const horoscopos = JSON.parse(posibleJSON);

    //insertar respuesta en la base de datos
    const insertQuery = `
      INSERT INTO horoscopos (id, signo, contenido, fecha, creado_en)
      VALUES (gen_random_uuid(), $1, $2, $3, now())
    `;

    for (const signo in horoscopos) {
      await pool.query(insertQuery, [signo, horoscopos[signo], hoyColombia]);
    }

    return res.json(horoscopos);

  } catch (error) {
    console.error('Error en generación o almacenamiento de horóscopos:', error.message);
    return res.status(500).json({ error: 'No se pudo generar el horóscopo' });
  }
});

module.exports = router;
