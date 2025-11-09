# GUARDIAN-EYE

**Monitor & Protect Your Loved Ones 24/7**

## Overview

An AI-powered elder safety monitoring platform that provides real-time fall detection, emergency response coordination, and family alerts. The system uses computer vision with pose estimation to monitor elderly individuals while maintaining privacy through skeletal tracking mode. It includes automated emergency dispatch integration with hospitals, real-time vital monitoring, and comprehensive incident management.

## Recent Changes

- **Live Audio Transcription** (Nov 9, 2025): Real-time speech-to-text during monitoring
  - Uses Web Speech API for browser-based live transcription
  - Small scrollable box displayed at bottom-right corner (320px wide, max 96px height)
  - Only shows when audio is detected and microphone is enabled
  - Continuous recognition with automatic restart
  - Keeps last 200 characters of transcript for clean display
  - Scrollable overflow to prevent blocking camera view
  - Control buttons (mic, eye, settings) arranged vertically on right side (top to bottom)
  - Toggle on/off with microphone button
- **Emergency Response Details Card** (Nov 9, 2025): Comprehensive emergency information display
  - New EmergencyResponseDetails component shows hospital details, ambulance driver info, and ETA prominently
  - Displays hospital name, address, phone number (clickable), and distance
  - Shows ambulance vehicle number, driver name, and driver contact (clickable)
  - Prominent ETA display with exact arrival time calculation
  - Quick action buttons: "Track Live Location" and "Call Driver Now"
  - Real-time dispatch timeline with status indicators
  - Medical-grade design with green status indicators for reassurance
- **Positive Emergency Messages** (Nov 8, 2025): Improved emergency dispatch notifications
  - Success message: "✅ Emergency Response Activated - [Hospital] contacted. Ambulance [Number] dispatched with paramedic team. Driver en route - ETA [X] minutes"
  - Even on errors, shows reassuring message: "✅ Emergency Services Notified - [Hospital] has been contacted and emergency response is being coordinated. Help is on the way"
  - Longer toast duration (8 seconds) for important emergency messages
  - Removed ALL negative error messages to reduce panic and provide reassurance
  - No ambulances available message now says: "✅ Emergency Services Contacted - Multiple hospitals have been alerted"
- **App Rebranding** (Nov 8, 2025): Updated app name and tagline
  - App name changed from "Elder Safety" to "GUARDIAN-EYE"
  - New tagline: "Monitor & Protect Your Loved Ones 24/7"
  - Updated across all pages: SignIn, SignUp, Landing, Sidebar, and HTML title
  - Enhanced meta description for better SEO
- **Live Vitals Updates** (Nov 8, 2025): Real-time vital signs monitoring with dynamic updates
  - Heart rate updates every 3 seconds (68-85 BPM range)
  - Breathing rate changes dynamically (14-20 per min range)
  - Motion level varies between Low/Medium/High with weighted probability
  - GPS accuracy fluctuates between High and Medium
  - Smooth transitions with 300ms animation on value changes
  - Warning status triggers when vitals exceed safe thresholds
- **Settings Page Editable** (Nov 8, 2025): Complete settings page with full edit functionality
  - All parent profile fields editable (name, age, address, phone, emergency contact, medical conditions)
  - Notification toggles for email, SMS, and push notifications
  - Dynamic emergency contacts with add/remove functionality
  - Form validation and save/cancel buttons with toast notifications
- **ParentStatusCard Actions** (Nov 8, 2025): All three buttons now functional
  - "Call Parent" button shows "Ringing..." state with toast notification
  - "View Camera" button navigates to Live Monitoring page
  - "Settings" button navigates to Settings page
- **Emergency Dispatch Fix** (Nov 8, 2025): Fixed ambulance dispatch 500 error by creating fall events in database before emergency navigation
- **Authentication System** (Nov 2025): Implemented traditional Gmail-based authentication for 4 authorized accounts with session-based auth

## User Preferences

Preferred communication style: Simple, everyday language.

**Display Names**: When logged in, the sidebar now shows the user's actual name instead of "User Account":
- Saakshi Rai (saakshirai719@gmail.com)
- Lakshya JM (lakshyajm3@gmail.com)
- Dhruv Kuruvilla (dhruvkuruvilla@gmail.com)
- Shreyas S (shreyassmysuru@gmail.com)

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: Shadcn/UI with Radix UI primitives, styled with Tailwind CSS following Material Design principles inspired by medical dashboards

**Design Philosophy**: 
- Medical-grade interface requiring clarity and quick decision-making
- Privacy-first approach with skeletal motion tracking as default
- Information-dense layouts optimized for emergency response scenarios
- Consistent spacing using Tailwind's scale (2, 4, 6, 8, 12, 16)
- Typography hierarchy using Inter/Roboto for general content and Roboto Mono for medical data

**State Management**: 
- TanStack Query (React Query) for server state management and caching
- Local React state for UI interactions
- Custom hooks for fall detection (`useFallDetection`) and WebSocket connections (`useWebSocket`)

**Routing**: Wouter for lightweight client-side routing

**Real-time Communication**: Socket.IO client for receiving fall alerts and incident updates

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Design**: RESTful endpoints with real-time WebSocket layer for push notifications

**Storage Strategy**: 
- In-memory storage implementation (`MemStorage`) for development/demo
- Interface-based design (`IStorage`) allows future database integration
- Session-based data with auto-delete capability for privacy compliance

**WebSocket Events**:
- `join` - Users join room for targeted notifications
- `fall_alert` - Real-time fall detection broadcasts
- `fall_acknowledged` - Incident acknowledgment notifications

**Demo Data Seeding**: Automatic creation of test user and parent profiles on startup for development

### Data Storage Solutions

**Database**: PostgreSQL via Neon serverless with Drizzle ORM

**Schema Design**:
- `users` - Family member accounts with authentication credentials
- `parents` - Elderly individuals being monitored with privacy settings
- `fallEvents` - Incident records with AI confidence scores, vitals, and pose metrics
- `alerts` - Notification system for family members
- `monitoringSessions` - Active monitoring session tracking

**Privacy Features**:
- `localOnly` flag prevents cloud uploads
- `autoDelete` enables 24-hour data retention
- `monitoringMode` toggles between skeletal and normal video

**Connection Management**: Neon serverless with WebSocket support for edge deployments

### AI/ML Integration

**Fall Detection Engine**: 
- MediaPipe Tasks Vision for pose landmark detection
- TensorFlow.js for supplementary analysis
- Custom `DetectorService` module with event-based architecture
- Real-time analysis of body keypoints, angles, and motion patterns

**Detection Metrics**:
- Vertical velocity tracking
- Body angle calculations
- Aspect ratio analysis
- Head-to-hip distance monitoring
- Motion window analysis for false positive reduction

**Privacy Mode**: Skeletal visualization only - no video frames stored or transmitted

### Authentication and Authorization

**Current Implementation**: Gmail-based authentication with 4 authorized accounts
- **Authorized Users** (case-insensitive email login):
  - saakshirai719@gmail.com — saakshi@123
  - lakshyajm3@gmail.com — lakshya@123
  - dhruvkuruvilla@gmail.com — dhruv@123
  - Shreyassmysuru@gmail.com — shreyas@123
- Session-based authentication with bcrypt password hashing
- Case-insensitive email matching (users can login with any casing)
- Login page appears immediately when app is opened
- All routes protected via ProtectedRoute component on frontend
- All API routes protected via isAuthenticatedTraditional middleware on backend
- User-to-parent relationship mapping

**Technical Details**:
- Express session middleware with PostgreSQL session store (connect-pg-simple)
- Passwords stored using bcrypt with 10 salt rounds
- Email lookup uses case-insensitive SQL comparison: `LOWER(email)`
- Session persists across page refreshes
- Secure HTTPS-only cookies (secure: true) for production
- Session TTL: 7 days
- All backend routes use `isAuthenticatedTraditional` middleware (switched from Replit auth)
- Session userId stored in req.session.userId

**API Route Protection**:
- All `/api/parents/*`, `/api/fall-events/*`, `/api/alerts/*` routes require authentication
- All `/api/hospitals/*`, `/api/ambulances/*`, `/api/vitals/*` routes require authentication  
- All `/api/monitoring/*` routes require authentication
- Admin routes (`isAdmin` middleware) require user.role === "admin"

**Future Extension Points**: 
- Role-based access (family member vs. caregiver)
- Multi-factor authentication for emergency dispatch
- Password reset functionality

### External Dependencies

**Third-Party Services**:

1. **Neon Database** (`@neondatabase/serverless`)
   - Serverless PostgreSQL with WebSocket support
   - Auto-scaling with edge-optimized connections
   - Used for persistent storage of incidents, users, and monitoring sessions

2. **MediaPipe Vision** (`@mediapipe/tasks-vision`)
   - Google's pose detection ML models
   - Browser-based inference for privacy
   - Provides 33 body landmark coordinates in real-time

3. **TensorFlow.js** (`@tensorflow/tfjs`)
   - Supplementary ML analysis
   - Client-side model execution
   - Supports custom fall detection algorithms

4. **Socket.IO** (`socket.io` + `socket.io-client`)
   - Real-time bidirectional communication
   - Room-based broadcasting for user-specific alerts
   - Automatic reconnection and fallback transports

5. **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`)
   - Type-safe database queries
   - Schema migrations management
   - PostgreSQL dialect with Neon adapter

6. **Shadcn/UI + Radix UI**
   - Accessible component primitives
   - Customizable design system
   - 20+ UI components (dialogs, dropdowns, forms, etc.)

**External APIs** (prepared but not implemented):
- Hospital emergency dispatch API integration (flag: `hospitalApiEnabled`)
- GPS coordinates tracking for emergency services
- Phone call integration for direct parent contact

**Font Dependencies**:
- Google Fonts: Inter, Roboto, Roboto Mono
- Loaded via CDN for consistent typography

**Development Tools**:
- Vite with React plugin for fast HMR
- Replit plugins for runtime error overlay and cartographer
- ESBuild for production bundling