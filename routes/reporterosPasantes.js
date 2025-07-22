const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// crear un nuevo pasante
router.post('/crear', async (req, res) => {
  const { nombre, descripcion, correo, rol, contrasena } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO reporteros_pasantes 
        (nombre, descripcion, correo, rol, contrasena) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [nombre, descripcion, correo, rol, contrasena]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al registrar pasante:', error.message);
    res.status(500).json({ error: 'Error al registrar pasante' });
  }
});

// Obtener solo reporteros
router.get('/reporteros', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM reporteros_pasantes WHERE rol = 'Reportero' ORDER BY creado_en DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener reporteros:', error.message);
    res.status(500).json({ error: 'Error al obtener reporteros' });
  }
});


// Obtener  administradores
router.get('/administradores', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM reporteros_pasantes WHERE rol = 'Administrador' ORDER BY creado_en DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener administradores:', error.message);
    res.status(500).json({ error: 'Error al obtener administradores' });
  }
});




// Eliminar un pasante por ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM reporteros_pasantes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pasante no encontrado' });
    }

    res.status(200).json({ mensaje: 'Pasante eliminado correctamente', eliminado: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar pasante:', error.message);
    res.status(500).json({ error: 'Error al eliminar pasante' });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM reporteros_pasantes WHERE correo = $1',
      [correo]
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.contrasena !== contrasena) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // No incluir la contraseña en la respuesta
    const { contrasena: _, ...datosUsuario } = usuario;

    res.status(200).json(datosUsuario);
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});



module.exports = router;
