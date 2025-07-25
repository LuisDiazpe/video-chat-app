import express from 'express';
import { createServer } from 'http';
import { ExpressPeerServer } from 'peer';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware CORS para permitir conexiones del frontend
app.use(cors());

// PeerJS server con configuración personalizada
const peerServer = ExpressPeerServer(server, {
    path: '/',
    allow_discovery: true
});

// Ruta para el servidor de PeerJS
app.use('/peerjs', peerServer);

// Logs
peerServer.on('connection', (client) => {
    console.log(`✅ Nuevo peer conectado: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`❌ Peer desconectado: ${client.getId()}`);
});

// Endpoint raíz de prueba
app.get('/', (req, res) => {
    res.send('Servidor PeerJS funcionando correctamente 🚀');
});

// Puerto configurado por entorno o fallback local
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`👉 PeerJS disponible en http://localhost:${PORT}/peerjs`);
});
