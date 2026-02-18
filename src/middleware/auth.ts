import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

/**
 * Extended Request interface with user info
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        uid: string;
        phone: string;
        role: string;
    };
}

/**
 * Middleware to verify Firebase Auth token
 */
export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized - No token provided' });
            return;
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(token);

        // Attach user info to request
        // Attach user info to request
        // For phone auth users, the ID is the phone number.
        // For email auth users, the ID is the UID.
        // We prioritize phone number to maintain backward compatibility.
        const userId = decodedToken.phone_number || decodedToken.uid;

        (req as AuthenticatedRequest).user = {
            id: userId,
            uid: decodedToken.uid,
            phone: decodedToken.phone_number || '',
            role: decodedToken.role || 'customer',
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
};

/**
 * Middleware to check user role
 */
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthenticatedRequest).user;

        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!roles.includes(user.role)) {
            res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
            return;
        }

        next();
    };
};
