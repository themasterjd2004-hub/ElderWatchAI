# Elder Safety & Emergency Response System - Technical Documentation

## 🚀 System Overview

An AI-powered emergency response system featuring real-time skeletal fall detection, automatic hospital dispatch, live ambulance GPS tracking, and dynamic vital signs monitoring - all with persistent PostgreSQL database storage.

## ✅ Completed Features

### 1. **Production-Ready Database Architecture** (PostgreSQL + Drizzle ORM)

All critical emergency data is persisted in PostgreSQL for reliability:

- **Users & Authentication** - Secure user accounts with Replit Auth
- **Parents** - Elder profiles with medical history and emergency contacts
- **Fall Events** - Complete fall detection logs with confidence scores and timestamps
- **Hospitals** - GPS coordinates, specializations, emergency contacts, ratings
- **Ambulances** - Real-time location tracking, status updates, ETA calculations
- **Vitals Logs** - Heart rate, blood pressure, oxygen saturation, respiratory rate, temperature, glucose levels
- **Alerts** - Multi-channel emergency notifications with delivery tracking
- **Monitoring Sessions** - Session tracking with duration and statistics

### 2. **AI-Based Hospital Location Detection**

Intelligent nearest hospital detection using the **Haversine Formula** for precise distance calculations:

```typescript
// API Endpoint: GET /api/hospitals/nearest?lat=39.7817&lng=-89.6501
const hospitals = await storage.getNearestHospitals(lat, lng, limit);
```

**Features:**
- Calculates great-circle distance between fall location and hospitals
- Returns top 5 nearest hospitals sorted by distance
- Includes hospital specializations, availability, and ratings
- Accounts for Earth's curvature for accurate GPS distance

### 3. **Live Ambulance GPS Tracking System** (Uber/Ola Style)

Real-time ambulance dispatch and tracking with WebSocket updates:

**API Endpoints:**
```typescript
POST /api/ambulances/dispatch
  Body: { ambulanceId, fallEventId, destination: { lat, lng } }

PATCH /api/ambulances/:id
  Body: { currentLocation, status, speed, distanceRemaining }
```

**Features:**
- Automatic ETA calculation based on distance
- Live GPS coordinate updates via WebSocket
- Status tracking: available → dispatched → en_route → arrived → completed
- Driver contact information
- Real-time distance and speed monitoring

### 4. **Dynamic Vitals Logging System**

Continuous vital signs monitoring with database persistence:

**API Endpoints:**
```typescript
POST /api/vitals
  Body: { parentId, heartRate, bloodPressure, oxygenSaturation, ... }

GET /api/vitals/latest/:parentId
GET /api/vitals/:parentId?limit=50
```

**Monitored Vitals:**
- Heart Rate (BPM)
- Blood Pressure (Systolic/Diastolic)
- Oxygen Saturation (%)
- Respiratory Rate (breaths/min)
- Body Temperature (°C)
- Glucose Level (mg/dL)
- Status classification: normal/warning/critical

### 5. **Real-Time Fall Detection** (MediaPipe Pose)

Skeletal pose detection using Google's MediaPipe for accurate fall detection:

**Features:**
- 33-point landmark tracking
- Configurable confidence thresholds
- Angle-based fall detection (torso, hip, shoulder angles)
- Real-time WebSocket alerts on detection
- Automatic parent profile linking
- False alarm acknowledgment system

### 6. **Replit Authentication System**

Secure session-based authentication with OpenID Connect:

**Implementation:**
- PostgreSQL session storage
- Secure cookie handling with `credentials: 'include'`
- Protected API routes
- User profile management
- Role-based access (admin/user)

### 7. **WebSocket Real-Time System**

Instant emergency notifications via Socket.IO:

**Events:**
- `fall_alert` - Immediate fall detection notification
- `ambulance_dispatched` - Ambulance assigned to emergency
- `ambulance_updated` - Live GPS position updates
- `vitals_updated` - Real-time vitals monitoring
- `fall_acknowledged` - Response confirmation

## 📊 Database Schema

### **Hospitals Table**
```sql
- id (primary key)
- name, address, phone, emergencyPhone
- gpsCoordinates (JSON: { lat, lng })
- specializations (array)
- availability, rating
- distanceKm (calculated), estimatedArrivalMin
```

### **Ambulances Table**
```sql
- id (primary key)
- hospitalId (foreign key)
- fallEventId (foreign key, nullable)
- vehicleNumber, driverName, driverPhone
- status (available/dispatched/en_route/arrived/completed)
- currentLocation, destinationLocation (JSON with timestamp)
- dispatchedAt, arrivedAt, estimatedArrival
- speed, distanceRemaining, route (GeoJSON)
```

### **VitalsLog Table**
```sql
- id (primary key)
- parentId (foreign key)
- fallEventId (foreign key, nullable)
- timestamp
- heartRate, bloodPressureSystolic, bloodPressureDiastolic
- oxygenSaturation, respiratoryRate, temperature, glucoseLevel
- status (normal/warning/critical)
```

## 🔧 API Routes Reference

### **Hospital Management**
- `GET /api/hospitals` - List all hospitals
- `GET /api/hospitals/nearest?lat=X&lng=Y` - Find nearest hospitals (AI-powered)
- `POST /api/hospitals` - Create new hospital

### **Ambulance Dispatch & Tracking**
- `GET /api/ambulances/:hospitalId` - Get ambulances by hospital
- `GET /api/ambulances/fall-event/:fallEventId` - Get ambulance for fall event
- `POST /api/ambulances/dispatch` - Dispatch ambulance to emergency
- `PATCH /api/ambulances/:id` - Update ambulance location/status

### **Vitals Monitoring**
- `POST /api/vitals` - Log new vitals reading
- `GET /api/vitals/latest/:parentId` - Get latest vitals
- `GET /api/vitals/:parentId?limit=50` - Get vitals history

### **Fall Events**
- `POST /api/fall-events` - Create fall event
- `GET /api/fall-events/:parentId` - Get fall history
- `POST /api/fall-events/:id/acknowledge` - Acknowledge fall event
- `PATCH /api/fall-events/:id` - Update fall event

### **Authentication**
- `GET /api/auth/profile` - Get current user profile
- `GET /api/auth/signout` - Sign out user
- `GET /api/auth/signin` - Redirect to login

### **Parents & Users**
- `POST /api/parents` - Create parent profile
- `GET /api/parents/:userId` - Get user's parents
- `PATCH /api/parents/:id` - Update parent profile

## 🎯 Demo Data

The system automatically seeds demo data on startup:

**Demo User:**
- Username: `demo`
- Password: `demo123`
- Email: demo@example.com

**3 Demo Hospitals:**
1. Springfield General Hospital (Emergency Medicine, Cardiology, Trauma Care)
2. St. Mary's Medical Center (Geriatric Care, Neurology, Orthopedics)
3. Central Illinois Regional Hospital (Trauma Care, Critical Care)

**6 Demo Ambulances:**
- 2 ambulances per hospital
- All in "available" status
- Located at hospital GPS coordinates

**Demo Parent:**
- Name: Margaret Wilson (76 years old)
- Medical Conditions: Hypertension, Arthritis
- Initial vitals logged (heart rate: 72, BP: 120/80, O2: 98%)

## 🔐 Security Features

- **PostgreSQL** persistent storage for all critical data
- **Session-based authentication** with secure cookies
- **Password hashing** for user accounts
- **Environment secrets** for sensitive configuration
- **CORS protection** for API endpoints
- **Input validation** using Zod schemas

## 🚦 System Status

✅ **Production-Ready Backend Infrastructure**
- PostgreSQL database with all tables
- AI-based nearest hospital detection
- Ambulance dispatch and tracking
- Vitals logging system
- Fall detection with MediaPipe
- WebSocket real-time alerts
- Replit Auth authentication

⏳ **Frontend UI (Next Steps)**
- Admin panel for user/parent management
- Landing page with login
- Live ambulance tracking map
- Dynamic vitals dashboard (auto-refresh every minute)
- Protected route guards

## 💡 Usage Example

```typescript
// 1. Fall detected via MediaPipe
const fallEvent = await fetch('/api/fall-events', {
  method: 'POST',
  body: JSON.stringify({
    parentId,
    type: 'fall',
    confidence: 0.95,
    location: "Living Room"
  })
});

// 2. Find nearest hospital (AI-based)
const hospitals = await fetch(
  `/api/hospitals/nearest?lat=${lat}&lng=${lng}`
);
const nearestHospital = hospitals[0];

// 3. Dispatch ambulance
const dispatch = await fetch('/api/ambulances/dispatch', {
  method: 'POST',
  body: JSON.stringify({
    ambulanceId: ambulances[0].id,
    fallEventId: fallEvent.id,
    destination: { lat, lng }
  })
});

// 4. Real-time tracking via WebSocket
socket.on('ambulance_updated', (ambulance) => {
  console.log(`ETA: ${ambulance.estimatedArrival}`);
  console.log(`Distance: ${ambulance.distanceRemaining}km`);
});
```

## 📈 Performance Considerations

- **Database Indexing**: Indexed on parentId, userId, timestamp for fast queries
- **WebSocket Rooms**: User-specific rooms for targeted notifications
- **GPS Calculations**: Optimized Haversine formula for distance computation
- **Query Limits**: Default 50 records with pagination support
- **Connection Pooling**: PostgreSQL connection pooling via Drizzle ORM

## 🔄 Data Flow

1. **Fall Detection** → MediaPipe detects fall → Creates fall event in DB → WebSocket alert
2. **Hospital Selection** → AI calculates nearest hospital using Haversine formula
3. **Ambulance Dispatch** → Assigns available ambulance → Updates status → Calculates ETA
4. **Live Tracking** → GPS updates every 5-10 seconds → WebSocket broadcasts → Frontend map updates
5. **Vitals Monitoring** → Sensor readings → Log to database → WebSocket updates → Frontend displays

## 🛠️ Tech Stack

- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Real-time**: Socket.IO (WebSocket)
- **AI/ML**: MediaPipe Pose Detection
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
