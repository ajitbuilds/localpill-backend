import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'localpill-9b150'
    });
}

const db = admin.firestore();

// Sample data
const sampleData = {
    // Sample Pharmacies
    pharmacies: [
        {
            id: 'pharmacy-1',
            name: 'Sharma Medicos',
            ownerName: 'Rajesh Sharma',
            phone: '+919876543210',
            email: 'sharma.medicos@gmail.com',
            address: {
                street: 'Shop No. 12, Main Market',
                area: 'Malviya Nagar',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302017',
                landmark: 'Near Metro Station'
            },
            location: {
                latitude: 26.8517,
                longitude: 75.7849,
                geohash: 'tsq8ug'
            },
            licenseNumber: 'RAJ/PHR/2023/12345',
            verified: true,
            isOnline: true,
            acceptingOrders: true,
            operatingHours: {
                monday: { open: '09:00', close: '22:00' },
                tuesday: { open: '09:00', close: '22:00' },
                wednesday: { open: '09:00', close: '22:00' },
                thursday: { open: '09:00', close: '22:00' },
                friday: { open: '09:00', close: '22:00' },
                saturday: { open: '09:00', close: '21:00' },
                sunday: { open: '10:00', close: '20:00' }
            },
            rating: 4.5,
            totalOrders: 245,
            partnerId: 'partner-user-1',
            pharmacistName: 'Dr. Rajesh Kumar',
            pharmacistQualification: 'B.Pharm',
            pharmacistExperience: '12 Years',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        },
        {
            id: 'pharmacy-2',
            name: 'HealthCare Pharmacy',
            ownerName: 'Priya Malhotra',
            phone: '+919999999999',
            email: 'healthcare.pharmacy@gmail.com',
            address: {
                street: '45, Civil Lines',
                area: 'C-Scheme',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302006',
                landmark: 'Opposite City Hospital'
            },
            location: {
                latitude: 26.9124,
                longitude: 75.7873,
                geohash: 'tsqbv3'
            },
            licenseNumber: 'RAJ/PHR/2022/67890',
            verified: true,
            isOnline: true,
            acceptingOrders: true,
            operatingHours: {
                monday: { open: '08:00', close: '23:00' },
                tuesday: { open: '08:00', close: '23:00' },
                wednesday: { open: '08:00', close: '23:00' },
                thursday: { open: '08:00', close: '23:00' },
                friday: { open: '08:00', close: '23:00' },
                saturday: { open: '08:00', close: '23:00' },
                sunday: { open: '08:00', close: '22:00' }
            },
            rating: 4.8,
            totalOrders: 512,
            partnerId: 'partner-user-2',
            pharmacistName: 'Dr. Priya Gupta',
            pharmacistQualification: 'M.Pharm',
            pharmacistExperience: '8 Years',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        },
        {
            id: 'pharmacy-3',
            name: 'MediPlus 24x7',
            ownerName: 'Amit Patel',
            phone: '+918888888888',
            email: 'mediplus24x7@gmail.com',
            address: {
                street: 'Ground Floor, Sunrise Plaza',
                area: 'Vaishali Nagar',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302021',
                landmark: 'Near Fire Station'
            },
            location: {
                latitude: 26.9050,
                longitude: 75.7280,
                geohash: 'tsq8xe'
            },
            licenseNumber: 'RAJ/PHR/2024/11223',
            verified: true,
            isOnline: true,
            acceptingOrders: true,
            operatingHours: {
                monday: { open: '00:00', close: '23:59' },
                tuesday: { open: '00:00', close: '23:59' },
                wednesday: { open: '00:00', close: '23:59' },
                thursday: { open: '00:00', close: '23:59' },
                friday: { open: '00:00', close: '23:59' },
                saturday: { open: '00:00', close: '23:59' },
                sunday: { open: '00:00', close: '23:59' }
            },
            rating: 4.7,
            totalOrders: 389,
            partnerId: 'partner-user-3',
            pharmacistName: 'Dr. Amit Singh',
            pharmacistQualification: 'B.Pharm, MBA',
            pharmacistExperience: '15 Years',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        }
    ],

    // Sample Users
    users: [
        {
            id: 'customer-user-1',
            name: 'Rahul Verma',
            phone: '+919876543210',
            email: 'rahul.verma@gmail.com',
            role: 'customer',
            profilePicture: null,
            addresses: [
                {
                    id: 'addr-1',
                    label: 'Home',
                    street: 'A-42, Vivek Vihar',
                    area: 'Malviya Nagar',
                    city: 'Jaipur',
                    state: 'Rajasthan',
                    pincode: '302017',
                    landmark: 'Near Sunrise School',
                    isDefault: true
                }
            ],
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        },
        {
            id: 'partner-user-1',
            name: 'Rajesh Sharma',
            phone: '+919876543210',
            email: 'sharma.medicos@gmail.com',
            role: 'partner',
            pharmacyId: 'pharmacy-1',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        },
        {
            id: 'agent-user-1',
            name: 'Amit Kumar',
            phone: '+919999999999',
            email: 'agent.amit@localpill.com',
            role: 'agent',
            employeeId: 'AG-2024-001',
            zone: 'Jaipur Central',
            targetStoresPerDay: 200,
            totalOnboarded: 178,
            totalVerified: 145,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        }
    ],

    // Sample Medication Requests
    medicationRequests: [
        {
            id: 'request-1',
            customerId: 'customer-user-1',
            customerName: 'Rahul Verma',
            customerPhone: '+919876543210',
            medicines: [
                { name: 'Dolo 650', quantity: '10 tablets' },
                { name: 'Azithral 500', quantity: '6 tablets' }
            ],
            prescriptionUrl: null,
            hasPrescription: true,
            deliveryAddress: {
                street: 'A-42, Vivek Vihar',
                area: 'Malviya Nagar',
                city: 'Jaipur',
                pincode: '302017',
                location: { latitude: 26.8517, longitude: 75.7849 }
            },
            searchRadius: 5, // km
            status: 'pending',
            priority: 'urgent',
            createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)), // 10 minutes ago
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 50 * 60 * 1000)), // expires in 50 minutes
            responses: [],
            totalPharmaciesNotified: 3
        },
        {
            id: 'request-2',
            customerId: 'customer-user-1',
            customerName: 'Rahul Verma',
            customerPhone: '+919876543210',
            medicines: [
                { name: 'Paracetamol 500mg', quantity: '20 tablets' }
            ],
            prescriptionUrl: null,
            hasPrescription: false,
            deliveryAddress: {
                street: 'A-42, Vivek Vihar',
                area: 'Malviya Nagar',
                city: 'Jaipur',
                pincode: '302017',
                location: { latitude: 26.8517, longitude: 75.7849 }
            },
            searchRadius: 2,
            status: 'accepted',
            priority: 'normal',
            acceptedBy: 'pharmacy-1',
            acceptedPharmacy: {
                name: 'Sharma Medicos',
                phone: '+919876543210'
            },
            quotedPrice: 45,
            createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
            acceptedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1.5 * 60 * 60 * 1000)),
            responses: [
                {
                    pharmacyId: 'pharmacy-1',
                    pharmacyName: 'Sharma Medicos',
                    available: true,
                    price: 45,
                    respondedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1.5 * 60 * 60 * 1000))
                }
            ],
            totalPharmaciesNotified: 2
        }
    ]
};

async function populateFirestore() {
    console.log('🚀 Starting Firestore population...\n');

    try {
        // Add Pharmacies
        console.log('📍 Adding pharmacies...');
        for (const pharmacy of sampleData.pharmacies) {
            await db.collection('pharmacies').doc(pharmacy.id).set(pharmacy);
            console.log(`  ✅ Added: ${pharmacy.name}`);
        }

        // Add Users
        console.log('\n👥 Adding users...');
        for (const user of sampleData.users) {
            await db.collection('users').doc(user.id).set(user);
            console.log(`  ✅ Added user: ${user.name} (${user.role})`);
        }

        // Add Medication Requests
        console.log('\n💊 Adding medication requests...');
        for (const request of sampleData.medicationRequests) {
            await db.collection('requests').doc(request.id).set(request);
            console.log(`  ✅ Added request: ${request.id} (${request.status})`);
        }

        console.log('\n🎉 Sample data added successfully!');
        console.log('\n📊 Summary:');
        console.log(`  - Pharmacies: ${sampleData.pharmacies.length}`);
        console.log(`  - Users: ${sampleData.users.length}`);
        console.log(`  - Medication Requests: ${sampleData.medicationRequests.length}`);

    } catch (error) {
        console.error('❌ Error populating Firestore:', error);
        throw error;
    }
}

// Run the script
populateFirestore()
    .then(() => {
        console.log('\n✅ All done! Your database is now populated with sample data.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
