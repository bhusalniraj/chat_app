import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';
import apiRoutes from './routes/index.js';
import { setupSocket } from './socket/socketHandler.js';
import { notFound, errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// Security and HTTP Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Socket.IO Setup
const io = setupSocket(server);
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'chat-app-backend'
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = config.port || 5000;

server.listen(PORT, () => {
  console.log(`[Server] Running in ${config.nodeEnv} mode on port ${PORT}`);
  console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
});
