/**
 * Main Express Server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';
import tenderRoutes from './routes/tender.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import companyRoutes from './routes/company.routes.js';



// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// WebSocket server for realtime updates
const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws'
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    message: 'Too many requests from this IP, please try again later.'
});
// app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes (will be imported)
app.get('/api', (req, res) => {
    res.json({
        name: 'Tender Analysis API',
        version: '1.0.0',
        endpoints: {
            upload: 'POST /api/tender/upload',
            status: 'GET /api/tender/:id/status',
            analysis: 'GET /api/tender/:id/analysis',
            list: 'GET /api/tender/list',
            similar: 'GET /api/tender/:id/similar'
        }
    });
});

// Register routes
app.use('/api/tender', tenderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/company', companyRoutes);



// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('📡 New WebSocket client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);

            // Handle different message types
            if (data.type === 'subscribe') {
                ws.documentId = data.documentId;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('📡 WebSocket client disconnected');
    });

    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connection established' }));
});

// Broadcast progress updates to subscribed clients
export function broadcastProgress(documentId, progress) {
    wss.clients.forEach((client) => {
        if (client.documentId === documentId && client.readyState === 1) {
            client.send(JSON.stringify({
                type: 'progress',
                documentId,
                progress
            }));
        }
    });
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found'
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  🚀 Tender Analysis Backend Server                   ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  📍 Server: http://localhost:${PORT}                   ║
║  📡 WebSocket: ws://localhost:${PORT}/ws               ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                        ║
║  📊 Database: ${process.env.DATABASE_URL ? '✓ Connected' : '✗ Not configured'}                           ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export { app, wss };
