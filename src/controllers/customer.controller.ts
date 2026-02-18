import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db, storage } from '../config/firebase';
import { Collections, MedicationRequest } from '../models';
import { Client } from '@googlemaps/google-maps-services-js';
import config from '../config';
import { io } from '../server';

const mapsClient = new Client({});

const REQUEST_EXPIRY_MINUTES = 5;

/**
 * Create medication request
 */
export const createRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const {
            patient_name,
            patient_phone,
            patient_address,
            patient_latitude,
            patient_longitude,
            medicines,
            prescription_image_url,
            has_prescription,
            is_emergency,
        } = req.body;

        // Validation
        if (!patient_name || !patient_phone || !patient_address || !medicines || medicines.length === 0) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Get user details
        const userDoc = await db.collection(Collections.USERS).doc(user.phone).get();
        const userData = userDoc.data();

        // Create request with 5-minute expiry
        const now = new Date();
        const expiresAt = new Date(now.getTime() + REQUEST_EXPIRY_MINUTES * 60 * 1000);

        const requestData: Partial<MedicationRequest> & { expiresAt: Date; radius?: number } = {
            customerId: user.phone,
            customerPhone: user.phone,
            customerName: userData?.name || '',
            medicines,
            hasPrescription: has_prescription || false,
            prescriptionUrl: prescription_image_url,
            patientName: patient_name,
            patientPhone: patient_phone,
            patientAddress: patient_address,
            patientLatitude: patient_latitude || 0,
            patientLongitude: patient_longitude || 0,
            isEmergency: is_emergency || false,
            urgency: is_emergency ? 'urgent' : 'normal',
            status: 'broadcasting',
            radius: req.body.radius || 5,
            expiresAt,
            createdAt: now,
            updatedAt: now,
        };

        const requestRef = await db.collection(Collections.REQUESTS).add(requestData);

        const savedRequest = { ...requestData, id: requestRef.id };

        // Broadcast to all connected partners via Socket.io
        try {
            io.to('partners').emit('request:new', {
                id: requestRef.id,
                patientName: patient_name,
                patientAddress: patient_address,
                patientLatitude: patient_latitude || 0,
                patientLongitude: patient_longitude || 0,
                medicines,
                isEmergency: is_emergency || false,
                radius: req.body.radius || 5,
                expiresAt: expiresAt.toISOString(),
                createdAt: now.toISOString(),
            });
            console.log(`Request ${requestRef.id} broadcasted to partners`);
        } catch (socketErr) {
            console.error('Socket broadcast failed (non-fatal):', socketErr);
        }

        res.json({
            success: true,
            requestId: requestRef.id,
            data: savedRequest,
        });
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
};

/**
 * Get customer's requests
 */
export const getMyRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;

        const requestsSnapshot = await db
            .collection(Collections.REQUESTS)
            .where('customerId', '==', user.phone)
            .orderBy('createdAt', 'desc')
            .get();

        const requests = requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({
            success: true,
            data: requests,
        });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Failed to get requests' });
    }
};

/**
 * Get request by ID
 */
export const getRequestById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        const requestDoc = await db.collection(Collections.REQUESTS).doc(id).get();

        if (!requestDoc.exists) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        res.json({
            success: true,
            data: { id: requestDoc.id, ...requestDoc.data() },
        });
    } catch (error) {
        console.error('Get request error:', error);
        res.status(500).json({ error: 'Failed to get request' });
    }
};

/**
 * Cancel request
 */
export const cancelRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { id } = req.params as { id: string };

        const requestRef = db.collection(Collections.REQUESTS).doc(id);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        const requestData = requestDoc.data();

        // Verify ownership
        if (requestData?.customerId !== user.phone) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // Update status
        await requestRef.update({
            status: 'cancelled',
            updatedAt: new Date(),
        });

        // Notify partners that this request is cancelled
        try {
            io.to('partners').emit('request:cancelled', { requestId: id });
            console.log(`Request ${id} cancelled, partners notified`);
        } catch (socketErr) {
            console.error('Socket cancel broadcast failed (non-fatal):', socketErr);
        }

        res.json({
            success: true,
            message: 'Request cancelled successfully',
        });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ error: 'Failed to cancel request' });
    }
};

/**
 * Get nearby pharmacies
 */
export const getNearbyPharmacies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { latitude, longitude, radius = 5 } = req.query;

        if (!latitude || !longitude) {
            res.status(400).json({ error: 'Latitude and longitude required' });
            return;
        }

        // Query pharmacies (Firestore doesn't support geoqueries natively)
        // You'll need to use GeoFirestore or implement manual distance calculation
        const pharmaciesSnapshot = await db
            .collection(Collections.PHARMACIES)
            .where('status', '==', 'verified')
            .get();

        const pharmacies = pharmaciesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() as any }))
            .filter(pharmacy => {
                // Calculate distance
                const distance = calculateDistance(
                    parseFloat(latitude as string),
                    parseFloat(longitude as string),
                    pharmacy.latitude,
                    pharmacy.longitude
                );
                return distance <= parseFloat(radius as string);
            })
            .map(pharmacy => ({
                ...pharmacy,
                distance: calculateDistance(
                    parseFloat(latitude as string),
                    parseFloat(longitude as string),
                    pharmacy.latitude,
                    pharmacy.longitude
                ),
            }))
            .sort((a, b) => a.distance - b.distance);

        res.json({
            success: true,
            data: pharmacies,
        });
    } catch (error) {
        console.error('Get nearby pharmacies error:', error);
        res.status(500).json({ error: 'Failed to get pharmacies' });
    }
};

/**
 * Get pharmacy by ID
 */
export const getPharmacyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        const pharmacyDoc = await db.collection(Collections.PHARMACIES).doc(id).get();

        if (!pharmacyDoc.exists) {
            res.status(404).json({ error: 'Pharmacy not found' });
            return;
        }

        res.json({
            success: true,
            data: { id: pharmacyDoc.id, ...pharmacyDoc.data() },
        });
    } catch (error) {
        console.error('Get pharmacy error:', error);
        res.status(500).json({ error: 'Failed to get pharmacy' });
    }
};

/**
 * Helper: Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}
