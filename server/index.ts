import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint para recibir la opción seleccionada
app.post('/api/seleccion', (req, res) => {
    const { lugar } = req.body;
    console.log(`Lugar seleccionado: ${lugar}`);
    res.json({ message: 'Lugar recibido correctamente', lugar });
});

app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
