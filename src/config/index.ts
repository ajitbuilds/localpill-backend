import dotenv from 'dotenv';
dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    jwtSecret: string;
    googleMapsApiKey: string;
    allowedOrigins: string[];
    otpExpiryMinutes: number;
    otpLength: number;
    socketPort: number;
}

const config: Config = {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || (() => {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET must be set in production!');
        }
        return 'dev-only-secret-not-for-production';
    })(),
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://localpill-9b150.web.app',
        'https://localpill-9b150.firebaseapp.com',
        'https://localpill.com',
        'https://www.localpill.com',
        'https://localpill-partner.web.app',
        'https://localpill-field-agent.web.app'
    ],
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
    otpLength: parseInt(process.env.OTP_LENGTH || '6'),
    socketPort: parseInt(process.env.SOCKET_PORT || '5001'),
};

export default config;

