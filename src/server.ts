import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from './config';
import './config/firebase'; // Initialize Firebase

// Import routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import partnerRoutes from './routes/partner.routes';
import agentRoutes from './routes/agent.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';

const app: Application = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
    cors: {
        origin: config.allowedOrigins,
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple rate limiter (in-memory, per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
    }

    next();
});

// Clean up rate limit map periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, 60 * 1000);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        message: 'LocalPill API is running',
        timestamp: new Date().toISOString(),
        socketIO: io ? 'initialized' : 'not available',
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Track connected partner sockets for broadcasting
const connectedPartners = new Map<string, { socketId: string; pharmacyId: string; lat?: number; lng?: number }>();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Partner registers with their pharmacy info
    socket.on('partner:register', (data: { pharmacyId: string; lat?: number; lng?: number }) => {
        connectedPartners.set(socket.id, {
            socketId: socket.id,
            pharmacyId: data.pharmacyId,
            lat: data.lat,
            lng: data.lng,
        });
        socket.join('partners'); // Join the partners room for broadcasts
        console.log(`Partner registered: ${data.pharmacyId} (socket: ${socket.id})`);
    });

    // Customer joins their request room for real-time updates
    socket.on('join:request', (requestId: string) => {
        socket.join(`request:${requestId}`);
        console.log(`Joined request room: ${requestId}`);
    });

    // Leave request room
    socket.on('leave:request', (requestId: string) => {
        socket.leave(`request:${requestId}`);
    });

    // Chat message via socket
    socket.on('chat:send', (data: { requestId: string; message: string }) => {
        // Broadcast to all in the request room
        io.to(`request:${data.requestId}`).emit('chat:message', {
            requestId: data.requestId,
            message: data.message,
            timestamp: new Date().toISOString(),
        });
    });

    socket.on('disconnect', () => {
        connectedPartners.delete(socket.id);
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Export io and connectedPartners for use in controllers
export { io, connectedPartners };

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config.nodeEnv === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
    console.log(`LocalPill API running on port ${PORT}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Socket.IO ready on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
