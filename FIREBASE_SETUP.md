# LocalPill Backend - Firebase Setup Guide

## Firebase Console Setup (Step-by-Step)

### 1. Create Firebase Project

1. जाएँ [Firebase Console](https://console.firebase.google.com)
2. "Add project" पर click करें
3. Project name: `localpill-project` (या कोई नाम)
4. Google Analytics enable करें (optional)
5. Project बन जाएगा!

### 2. Enable Authentication

1. Left sidebar में **Build** → **Authentication** select करें
2. "Get started" click करें
3. **Sign-in method** tab में जाएँ
4. **Phone** provider enable करें:
   - Toggle को ON करें
   - Save करें
   
**Note**: Phone authentication के लिए:
- Development में test phone numbers add कर सकते हैं
- Production में real SMS भेजे जाएंगे (Google Cloud billing required)

### 3. Enable Firestore Database

1. **Build** → **Firestore Database**
2. "Create database" click करें
3. **Start in production mode** select करें (security rules बाद में configure करेंगे)
4. Location select करें: `asia-south1` (Mumbai) या nearest
5. "Enable" click करें

### 4. Setup Security Rules

Firestore → **Rules** tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.phone_number == userId;
    }
    
    // Pharmacies collection
    match /pharmacies/{pharmacyId} {
      allow read: if request.auth != null;
      allow create: if request.auth.token.role == 'agent';
      allow update: if request.auth.token.role == 'agent' || 
                      request.auth.token.role == 'partner';
    }
    
    // Medication requests
    match /medication_requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth.token.role == 'customer';
      allow update: if request.auth.token.role in ['customer', 'partner'];
    }
    
    // Chats
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
    
    // Chat messages
    match /chat_messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Enable Storage

1. **Build** → **Storage**
2. "Get started" click करें
3. **Start in production mode**
4. Same location select करें
5. Done!

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /prescriptions/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

### 6. Get Service Account Key

1. Project Settings (⚙️ icon) → **Service accounts** tab
2. Scroll down to **Firebase Admin SDK**
3. "Generate new private key" button click करें
4. JSON file download होगी
5. इस file को rename करें: `serviceAccountKey.json`
6. Backend project root में copy करें

**⚠️ Important**: यह file को `.gitignore` में add करें! (already added है)

### 7. Google Maps API Setup

1. जाएँ [Google Cloud Console](https://console.cloud.google.com)
2. Same project select करें (Firebase automatically creates Google Cloud project)
3. **APIs & Services** → **Library**
4. Search करें: **Maps JavaScript API** और enable करें
5. Search करें: **Geocoding API** और enable करें
6. **APIs & Services** → **Credentials**
7. "Create credentials" → "API key"
8. API key copy करें
9. (Optional) Restrict करें: 
   - Application restrictions → HTTP referrers
   - API restrictions → Maps JavaScript API, Geocoding API

### 8. Update .env File

```bash
# Use service account file (easiest)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Server
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

## Testing Setup

### Test Phone Numbers (Development)

Firebase Console → Authentication → Sign-in method → Phone → 
Add test phone numbers:

```
Phone: +91 9999999999
OTP: 123456
```

इससे development में बिना SMS के test कर सकते हैं।

### Verify Setup

1. Install dependencies:
```bash
npm install
```

2. Start server:
```bash
npm run dev
```

3. Test health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "LocalPill API is running",
  "timestamp": "2024-..."
}
```

## Frontend Integration

### Customer Frontend

Update `.env`:
```bash
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=localpill-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=localpill-project
```

**Firebase Web Config** मिलेगा:
- Firebase Console → Project Settings → General
- Scroll down to "Your apps"
- Web icon (`</>`) click करें या existing app select करें
- `firebaseConfig` object copy करें

### Install Firebase in Frontend

```bash
cd localpill-customer-frontend
npm install firebase
```

## Production Deployment

### Option 1: Firebase Hosting + Cloud Functions

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase init functions
firebase deploy
```

### Option 2: VPS/Cloud Server

- Railway.app
- Render.com
- DigitalOcean
- AWS EC2

```bash
npm run build
npm start
```

## Troubleshooting

**Error**: "Failed to initialize Firebase"
→ Check `serviceAccountKey.json` path

**Error**: "Phone authentication not enabled"
→ Enable Phone provider in Firebase Console

**Error**: "Google Maps API key invalid"
→ Enable Maps JavaScript API and Geocoding API

**Error**: "Firestore permission denied"
→ Update security rules in Firestore

## Next Steps

1. ✅ Setup complete ho गया
2. Install dependencies: `npm install`
3. Start backend: `npm run dev`
4. Frontend में Firebase SDK integrate करें
5. Test complete flow (signup → login → API calls)

---

Need help? Check Firebase docs: https://firebase.google.com/docs
