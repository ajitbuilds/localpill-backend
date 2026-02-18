import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { storage } from '../config/firebase';
import * as path from 'path';

/**
 * Upload a file to Firebase Storage
 * Accepts base64 encoded file data or handles file from request body
 */
export const uploadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { fileData, fileName, contentType, folder = 'uploads' } = req.body;

        if (!fileData || !fileName) {
            res.status(400).json({ error: 'fileData and fileName are required' });
            return;
        }

        // Validate content type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        const mimeType = contentType || 'image/jpeg';
        if (!allowedTypes.includes(mimeType)) {
            res.status(400).json({ error: 'Invalid file type. Allowed: jpeg, png, webp, pdf' });
            return;
        }

        // Generate unique file name
        const ext = path.extname(fileName) || '.jpg';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const filePath = `${folder}/${user.uid || user.phone}/${uniqueName}`;

        // Upload to Firebase Storage
        const bucket = storage.bucket();
        const file = bucket.file(filePath);

        // Decode base64 data
        const buffer = Buffer.from(fileData, 'base64');

        // Check file size (max 10MB)
        if (buffer.length > 10 * 1024 * 1024) {
            res.status(400).json({ error: 'File too large. Maximum 10MB allowed.' });
            return;
        }

        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
                metadata: {
                    uploadedBy: user.uid || user.phone,
                    originalName: fileName,
                },
            },
        });

        // Make file publicly accessible
        await file.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        res.json({
            success: true,
            data: {
                url: publicUrl,
                path: filePath,
                fileName: uniqueName,
                contentType: mimeType,
                size: buffer.length,
            },
        });
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};

/**
 * Upload prescription image
 */
export const uploadPrescription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    (req.body as any).folder = 'prescriptions';
    return uploadFile(req, res);
};

/**
 * Upload pharmacy document
 */
export const uploadPharmacyDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    (req.body as any).folder = 'pharmacy-docs';
    return uploadFile(req, res);
};
