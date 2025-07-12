const express = require('express');
const router = express.Router();
const pool = require('../config/db');

//obtener la ip del usuario
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
}

//toggle de like (dar o quitar)
router.post('/', async (req, res) => {
  const { noticia_id } = req.body;
  const ip = getClientIp(req);

  if (!noticia_id) {
    return res.status(400).json({ error: 'Falta el ID de la noticia' });
  }

  try {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM likes WHERE noticia_id = $1 AND ip_usuario = $2',
      [noticia_id, ip]
    );

    if (rowCount > 0) {
      //si ya existe el like, eliminarlo y restar 1 en bd
      await pool.query(
        'DELETE FROM likes WHERE noticia_id = $1 AND ip_usuario = $2',
        [noticia_id, ip]
      );

      await pool.query(
        'UPDATE noticias SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
        [noticia_id]
      );

      return res.status(200).json({ mensaje: 'Like quitado', liked: false });
    } else {
      //si no existe el like, insertarlo y sumar 1 en bd
      await pool.query(
        'INSERT INTO likes (noticia_id, ip_usuario) VALUES ($1, $2)',
        [noticia_id, ip]
      );

      await pool.query(
        'UPDATE noticias SET like_count = like_count + 1 WHERE id = $1',
        [noticia_id]
      );

      return res.status(200).json({ mensaje: 'Like agregado', liked: true });
    }
  } catch (error) {
    console.error('Error al manejar like:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


//obtener los likes del usuario
router.get('/mis-likes', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;

  try {
    const { rows } = await pool.query(
      'SELECT noticia_id FROM likes WHERE ip_usuario = $1',
      [ip]
    );

    const ids = rows.map(r => r.noticia_id);
    return res.status(200).json({ likes: ids });
  } catch (error) {
    console.error('Error al obtener likes:', error.message);
    return res.status(500).json({ error: 'Error al obtener likes del usuario' });
  }
});


module.exports = router;



