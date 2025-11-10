# GUARDIAN-EYE

**Monitor & Protect Your Loved Ones 24/7**

## Overview

GUARDIAN-EYE is an AI-powered elder safety monitoring platform designed to provide real-time fall detection, emergency response coordination, and family alerts. It uniquely incorporates **sign language detection** for enhanced accessibility and communication. The system prioritizes privacy by utilizing computer vision with pose estimation (skeletal tracking) to monitor individuals. Key capabilities include automated emergency dispatch integration, real-time vital monitoring, comprehensive incident management, and real-time sign language transcription with text-to-speech output. The project aims to deliver a "Calm Intelligence" medical-grade user experience, offering peace of mind to families and caregivers.

## User Preferences

Preferred communication style: Simple, everyday language.

**Display Names**: When logged in, the sidebar now shows the user's actual name instead of "User Account":
- Saakshi Rai (saakshirai719@gmail.com)
- Lakshya JM (lakshyajm3@gmail.com)
- Dhruv Kuruvilla (dhruvkuruvilla@gmail.com)
- Shreyas S (shreyassmysuru@gmail.com)

## System Architecture

### Frontend Architecture

*   **Framework**: React with TypeScript, using Vite for building.
*   **UI/UX**: Shadcn/UI with Radix UI primitives, styled with Tailwind CSS, adhering to Material Design principles inspired by medical dashboards. The design emphasizes clarity, quick decision-making, privacy (skeletal tracking by default), and information density for emergency scenarios.
    *   **Theme**: "ElderSense" with a premium color palette (Medical Blue, Mint Green, Amber, Critical Red), Poppins headings, Roboto Mono for medical data, and a multi-tier shadow system.
    *   **Accessibility**: Sign language detection with real-time transcription and text-to-speech for hearing/speech impaired users.
*   **State Management**: TanStack Query for server state, local React state for UI, custom hooks for fall detection and WebSockets.
*   **Routing**: Wouter for lightweight client-side routing.
*   **Real-time Communication**: Socket.IO client for alerts and incident updates.

### Backend Architecture

*   **Runtime**: Node.js with Express.js.
*   **API Design**: RESTful endpoints complemented by a real-time WebSocket layer for push notifications.
*   **Storage Strategy**: Interface-based `IStorage` with an in-memory `MemStorage` for development, allowing future database integration. Session-based data includes auto-deletion for privacy.
*   **WebSocket Events**: `join`, `fall_alert`, `fall_acknowledged`.

### Data Storage Solutions

*   **Database**: PostgreSQL via Neon serverless with Drizzle ORM.
*   **Schema**: `users`, `parents`, `fallEvents`, `alerts`, `monitoringSessions`.
*   **Privacy Features**: `localOnly` flag, `autoDelete` for 24-hour data retention, `monitoringMode` toggle (skeletal/normal video).

### AI/ML Integration

*   **Multi-Signal Distress Detection System** (Nov 10, 2025): Comprehensive emergency detection beyond falls
    *   **Voice Distress Detection**: Real-time keyword analysis in 15 languages with 100+ emergency phrases
        *   Keywords: "help," "ouch," "pain," "I don't feel safe," medical terms in English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Spanish, French, German, Chinese, Japanese, Arabic
        *   Severity levels: Critical (help/emergency), High (pain/unsafe), Medium (uncomfortable)
        *   30-second cooldown per keyword prevents alert spam
        *   Integrated into speech transcription pipeline with instant notifications
    *   **Abnormal Movement Pattern Detection**: AI-powered activity analysis using kinematic features
        *   **Stumbling**: Lateral center-of-mass oscillation, low stability score, partial verticality loss (HIGH priority - fall prevention)
        *   **Freezing**: Sudden velocity collapse after active movement lasting 2+ seconds (HIGH priority - stroke/Parkinson's indicator)
        *   **Prolonged Lying**: Duration-based escalation (5min→MEDIUM, 15min→HIGH, 30min→CRITICAL)
        *   Shared kinematic feature extraction: velocity (overall/vertical/lateral), posture (angle/orientation), quality (smoothness/stability/symmetry)
        *   Modular `IPatternDetector` interface for extensibility
    *   **ActivityPatternAnalyzer**: Coordinates all detectors with unified alert pipeline
        *   Per-frame analysis alongside fall detection
        *   Severity-based routing: Critical→dispatch, High→notify family, Medium→log
        *   Cooldown management prevents duplicate alerts
        *   Console logging with confidence scores and metadata
*   **Fall Detection Engine**: MediaPipe Tasks Vision for pose landmark detection and TensorFlow.js for supplementary analysis. Features a custom `DetectorService` analyzing body keypoints, angles, and motion patterns.
*   **Sign Language Detection**: Real-time recognition using MediaPipe GestureRecognizer (21 landmarks per hand) with 7 built-in gestures mapped to meanings via a `SignVocabulary` module. Includes a `GestureDetector` service and `SignLanguageOverlay` component.
    *   **Current Architecture**: Sign language runs as independent opt-in feature alongside fall detection. User toggles enable/disable sign language mode via hand icon button.
    *   **Technical Note**: Fall detector and sign language detector currently operate independently (not through unified useDetectionManager hook). Both systems function correctly but maintain separate GPU contexts when active. Future optimization: migrate to detector-orchestrator pattern for unified mode switching and resource management.
*   **Privacy Mode**: Skeletal visualization only; no video frames stored or transmitted.

### Authentication and Authorization

*   **Current Implementation**: Gmail-based authentication for 4 authorized accounts (saakshirai719@gmail.com, lakshyajm3@gmail.com, dhruvkuruvilla@gmail.com, shreyassmysuru@gmail.com) with session-based authentication using bcrypt hashing.
*   **Security**: Express session middleware with PostgreSQL store, HTTPS-only cookies, 7-day session TTL.
*   **Access Control**: All frontend and API routes are protected by authentication middleware, with user-to-parent relationship mapping.

## External Dependencies

*   **Neon Database**: Serverless PostgreSQL for persistent storage.
*   **MediaPipe Vision** (`@mediapipe/tasks-vision`): Google's ML models for browser-based pose and gesture detection.
*   **TensorFlow.js** (`@tensorflow/tfjs`): Client-side ML for supplementary analysis.
*   **Socket.IO** (`socket.io` + `socket.io-client`): Real-time bidirectional communication.
*   **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`): Type-safe database queries and migrations.
*   **Shadcn/UI + Radix UI**: Accessible and customizable UI component library.
*   **Google Fonts**: Inter, Roboto, Roboto Mono (loaded via CDN).