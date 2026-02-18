// Script to add sample pharmacies with location data to Firestore
// Run this to populate database for location feature testing

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Sample pharmacies with real coordinates
// Using BOTH formats: latitude/longitude (backend) and location.lat/lng (frontend)
const samplePharmacies = [
    // Bangalore Pharmacies
    {
        name: "Apollo Pharmacy - MG Road",
        address: "MG Road, Bangalore, Karnataka 560001",
        phone: "+91 80 4142 1234",
        licenseNumber: "KA-BLR-001",
        latitude: 12.9716,
        longitude: 77.5946,
        location: { lat: 12.9716, lng: 77.5946 },
        status: "verified",
        operatingHours: { open: "08:00", close: "22:00" },
        rating: 4.5,
        isOpen: true,
        isVerified: true
    },
    {
        name: "MedPlus - Koramangala",
        address: "Koramangala 5th Block, Bangalore 560095",
        phone: "+91 80 4567 8901",
        licenseNumber: "KA-BLR-002",
        latitude: 12.9352,
        longitude: 77.6245,
        location: { lat: 12.9352, lng: 77.6245 },
        status: "verified",
        operatingHours: { open: "07:00", close: "23:00" },
        rating: 4.3,
        isOpen: true,
        isVerified: true
    },
    {
        name: "Guardian Pharmacy - Indiranagar",
        address: "100 Feet Road, Indiranagar, Bangalore 560038",
        phone: "+91 80 2345 6789",
        licenseNumber: "KA-BLR-003",
        latitude: 12.9784,
        longitude: 77.6408,
        location: { lat: 12.9784, lng: 77.6408 },
        status: "verified",
        operatingHours: { open: "08:30", close: "21:30" },
        rating: 4.6,
        isOpen: true,
        isVerified: true
    },
    {
        name: "Wellness Forever - Whitefield",
        address: "ITPL Main Road, Whitefield, Bangalore 560066",
        phone: "+91 80 6789 0123",
        licenseNumber: "KA-BLR-004",
        latitude: 12.9698,
        longitude: 77.7499,
        location: { lat: 12.9698, lng: 77.7499 },
        status: "verified",
        operatingHours: { open: "09:00", close: "22:00" },
        rating: 4.4,
        isOpen: true,
        isVerified: true
    },
    {
        name: "Netmeds - HSR Layout (24x7)",
        address: "27th Main Road, HSR Layout, Bangalore 560102",
        phone: "+91 80 8765 4321",
        licenseNumber: "KA-BLR-005",
        latitude: 12.9121,
        longitude: 77.6446,
        location: { lat: 12.9121, lng: 77.6446 },
        status: "verified",
        operatingHours: { open: "00:00", close: "24:00" },
        rating: 4.7,
        isOpen: true,
        isVerified: true
    },
    // Mumbai Pharmacies
    {
        name: "Apollo Pharmacy - Bandra",
        address: "Linking Road, Bandra West, Mumbai 400050",
        phone: "+91 22 2640 1234",
        licenseNumber: "MH-MUM-001",
        latitude: 19.0596,
        longitude: 72.8295,
        location: { lat: 19.0596, lng: 72.8295 },
        status: "verified",
        operatingHours: { open: "08:00", close: "22:00" },
        rating: 4.5,
        isOpen: true,
        isVerified: true
    },
    {
        name: "MedPlus - Andheri",
        address: "Veera Desai Road, Andheri West, Mumbai 400053",
        phone: "+91 22 2673 5678",
        licenseNumber: "MH-MUM-002",
        latitude: 19.1136,
        longitude: 72.8697,
        location: { lat: 19.1136, lng: 72.8697 },
        status: "verified",
        operatingHours: { open: "07:00", close: "23:00" },
        rating: 4.4,
        isOpen: true,
        isVerified: true
    },
    // Delhi Pharmacy
    {
        name: "Apollo Pharmacy - Connaught Place",
        address: "Connaught Place, New Delhi 110001",
        phone: "+91 11 4142 1234",
        licenseNumber: "DL-DEL-001",
        latitude: 28.6304,
        longitude: 77.2177,
        location: { lat: 28.6304, lng: 77.2177 },
        status: "verified",
        operatingHours: { open: "08:00", close: "22:00" },
        rating: 4.6,
        isOpen: true,
        isVerified: true
    }
];

async function addPharmacies() {
    console.log('🏥 Adding sample pharmacies to Firestore...\n');

    try {
        const batch = db.batch();
        const pharmaciesRef = db.collection('pharmacies');

        for (const pharmacy of samplePharmacies) {
            const docRef = pharmaciesRef.doc(); // Auto-generate ID
            batch.set(docRef, {
                ...pharmacy,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`✅ ${pharmacy.name}`);
            console.log(`   📍 ${pharmacy.address}`);
            console.log(`   🗺️  Coordinates: ${pharmacy.latitude}, ${pharmacy.longitude}\n`);
        }

        await batch.commit();

        console.log(`\n✅ Successfully added ${samplePharmacies.length} pharmacies to Firestore!`);
        console.log('\n📊 Summary:');
        console.log(`   - Bangalore: 5 pharmacies`);
        console.log(`   - Mumbai: 2 pharmacies`);
        console.log(`   - Delhi: 1 pharmacy`);
        console.log('\n🎯 All pharmacies have coordinates for distance calculation!');
        console.log('📱 Both backend API (latitude/longitude) and frontend (location.lat/lng) formats included');

    } catch (error) {
        console.error('❌ Error adding pharmacies:', error);
    }
}

// Run the script
addPharmacies()
    .then(() => {
        console.log('\n✅ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
