# LocalPill Backend API 🏥

Firebase-based backend for LocalPill pharmacy platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase project
- Google Cloud account (for Maps API)

### Installation

```bash
cd localpill-backend
npm install
```

### Firebase Setup

1. Create Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → **Phone** provider
3. Enable **Firestore Database**
4. Enable **Storage**
5. Download service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```bash
# Either use service account file
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# OR set individual variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Server config
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## 📚 API Documentation

### Authentication

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "idToken": "firebase-id-token-here"
}
```

### Customer APIs

All customer endpoints require `Authorization: Bearer <token>` header.

#### Create Request
```http
POST /api/customer/requests
{
  "patient_name": "John Doe",
  "patient_phone": "+919876543210",
  "patient_address": "123 Main St",
  "patient_latitude": 28.6139,
  "patient_longitude": 77.2090,
  "medicines": [
    {"name": "Dolo 650", "quantity": 2}
  ],
  "has_prescription": true,
  "is_emergency": false
}
```

#### Get My Requests
```http
GET /api/customer/requests
```

#### Get Nearby Pharmacies
```http
GET /api/customer/pharmacies/nearby?latitude=28.6139&longitude=77.2090&radius=5
```

### Partner APIs

#### Get Pending Requests
```http
GET /api/partner/requests/pending
Authorization: Bearer <token>
```

#### Accept Request
```http
POST /api/partner/requests/{id}/accept
{
  "totalPrice": 150,
  "estimatedTime": 30,
  "notes": "Available"
}
```

#### Get Stats
```http
GET /api/partner/stats
```

### Agent APIs

#### Create Pharmacy
```http
POST /api/agent/pharmacies
{
  "name": "Apollo Pharmacy",
  "address": "123 MG Road",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "licenseNumber": "DL12345",
  "ownerPhone": "+919876543210",
  "ownerName": "John Doe"
}
```

#### Approve Pharmacy
```http
PUT /api/agent/pharmacies/{id}/approve
```

#### Get Agent Stats
```http
GET /api/agent/stats
```

## 🗂️ Firestore Collections

- **users** - Customer, Partner, Agent profiles
- **pharmacies** - Pharmacy information
- **medication_requests** - Medicine requests
- **chats** - Chat sessions
- **chat_messages** - Individual messages
- **notifications** - User notifications

## 🛠️ Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Maps**: Google Maps API
- **Real-time**: Socket.IO (planned)

## 📁 Project Structure

```
src/
├── config/          # Configuration (Firebase, env)
├── controllers/     # Request handlers
├── middleware/      # Auth, validation
├── models/          # TypeScript interfaces
├── routes/          # API routes
├── services/        # Business logic
└── server.ts        # Entry point
```

## 🚢 Deployment

### Using Firebase Functions

```bash
npm install -g firebase-tools
firebase login
firebase init functions
npm run deploy:functions
```

### Using Traditional Server

```bash
npm run build
npm start
```

## 📝 Notes

- Firebase Auth handles OTP automatically via client SDK
- Phone numbers must include country code (+91 for India)
- Firestore indexes may be needed for complex queries
- Google Maps API key needs billing enabled

## 🔒 Security

- All protected routes use Firebase token verification
- Role-based access control (customer/partner/agent)
- CORS configured for allowed origins only

---

Made with ❤️ for LocalPill
