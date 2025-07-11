const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// rutas para consumir el backend
app.use('/api/noticias', require('./routes/noticias'));
app.use('/api/horoscopos', require('./routes/horoscopo'));
app.use('/api/noticias/destacadas', require('./routes/noticiasDestacadas'));
app.use('/api/noticias/ultimas', require('./routes/noticiasUltimas'));
app.use('/api/noticias/verde', require('./routes/noticiasVerdes'));
app.use('/api/noticias/deportes', require('./routes/noticiasDeportes'));
app.use('/api/entrevistas', require('./routes/entrevistas'));
app.use('/api/tulio', require('./routes/tulio'));


app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
