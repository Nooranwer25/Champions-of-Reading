# Product Requirements Document (PRD)

## 1. Product Overview
**Product Name:** The Cursed Archive (The Colony)
**Product Vision:** A highly gamified, anime-inspired (dark fantasy/Jujutsu Kaisen aesthetic) reading tracker and social competition platform. It transforms the solitary act of reading into an engaging, competitive "esports-like" experience where users (Sorcerers) earn points (Cursed Energy) and ranks based on the books (Tomes) they read.

## 2. Target Audience
*   Avid readers looking for a unique, gamified way to track their reading habits.
*   Fans of anime, manga, and dark fantasy aesthetics who appreciate immersive, thematic UI/UX.
*   Competitive individuals motivated by leaderboards, badges, and ranking systems.

## 3. User Roles
*   **Sorcerer (Standard User):** Can submit books, track their reading history, view their stats/badges, and compete on the global leaderboard.
*   **Archivist / Oracle (Admin):** Responsible for maintaining the integrity of the archive. Can review, approve, or reject book submissions and assign "Impact Scores" (Cursed Energy points) based on the difficulty or length of the book.

## 4. Core Features & Functionalities

### 4.1. Authentication & Onboarding
*   **Sign-In:** Google Authentication and Developer/Test Email Authentication via Firebase.
*   **User Provisioning:** Automatic creation of a user profile with default stats (0 points, Grade 4 Sorcerer rank) upon first login.

### 4.2. Book Submissions (Manifestations)
*   Users can submit a record of a book they have completed.
*   **Required Fields:** Title, Author, Genre, Page Count, and Personal Thoughts/Review.
*   **State:** Submissions start in a "Pending" (Awaiting Judgment) state until reviewed by an Archivist.
*   **Thematic Feedback:** Cinematic audio cues and visual particle explosions upon successful submission.

### 4.3. The Oracle (Admin Review Dashboard)
*   A secure dashboard accessible only to users with the `Archivist` role or specific admin emails.
*   **Review Queue:** View all pending submissions.
*   **Judgment Actions:** 
    *   *Approve:* Assign an "Impact Score" (Cursed Energy) to the user and mark the book as verified.
    *   *Reject (Annihilate):* Deny the submission with thematic visual feedback.

### 4.4. Progression & Badges
*   **Cursed Energy:** Points awarded for approved reading submissions.
*   **Ranking System:** Users rank up (e.g., Grade 4, Grade 3, Semi-Grade 1, Special Grade) based on their accumulated Cursed Energy.
*   **Badges & Feats:** Automated achievement system (e.g., reading 10 books, reading specific genres) evaluating user stats on every profile load.

### 4.5. The Arena (Leaderboards)
*   Global ranking dashboard comparing all Sorcerers.
*   Displays Top Archivists (users) by Cursed Energy and Tomes Conquered.
*   Displays recent global activity (latest approved book submissions).

### 4.6. AI Integration (Kogane)
*   **AI Companion:** "Kogane", a Gemini-powered AI assistant.
*   **Contextual Assistance:** Provides book summaries, personalized reading recommendations based on user history, and thematic dialogue.
*   **Text-to-Speech:** Cinematic voice lines using Web Audio APIs for immersion.

## 5. Technical Stack
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS.
*   **Styling/UI:** Framer Motion (animations), Lucide React (icons), custom canvas-based particle effects.
*   **Backend & Database:** Firebase Authentication, Cloud Firestore (NoSQL database).
*   **AI Integration:** `@google/genai` (Gemini AI API) for text generation and intelligent recommendations.

## 6. Non-Functional Requirements
*   **Aesthetic Constraints:** Deep, high-contrast dark mode (slate/charcoal) with neon gold and cursed purple accents. No generic UI elements; everything must feel deliberate, harsh, and impactful.
*   **Performance:** Fluid 60fps animations for UI transitions and canvas particle explosions.
*   **Responsiveness:** Mobile-first design that scales gracefully to desktop and ultra-wide displays.
*   **Security:** Firestore Security Rules to strictly enforce Admin-only writes for approvals and user-specific writes for submissions.
