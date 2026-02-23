# ✨ Ultimate Workspace: Task Manager

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-ff0055?logo=framer)](https://www.framer.com/motion/)

A premium, hyper-spaced task management application designed for focus, clarity, and visual excellence. Built with a modern tech stack to provide a seamless, real-time workspace experience.

---

## 🚀 Key Features

### 💎 Ultra-Spaced Design Philosophy
The application features a unique **"Hyper-Spaced"** layout, prioritizing visual separation and maximum breathing room. This uncluttered approach reduces cognitive load and provides a high-end, gallery-like feel to your workspace.

### ⚡ Real-Time Synchronization
Powered by **Firebase**, your tasks, progress, and profile updates sync instantly across all sessions. Whether you're adding a task or marking it complete, the UI responds with fluid, zero-latency updates.

### 📊 Intelligence Overview
- **Dynamic Dashboard**: A comprehensive landing page showing total tasks, completion rates, and system-wide overview.
- **Priority Breakdown**: Visual analytics showing the distribution of High, Medium, and Low priority tasks.
- **Progress Tracking**: Real-time progress bars calculating your overall workspace completion rate.

### 🛠️ Advanced Task Management
- **Smart Validation**: Strict date/time requirements with 4-digit year validation to prevent data entry errors.
- **Urgency Markers**: Star important tasks and use color-coded priority badges (High, Medium, Low).
- **Recent Activity**: A dedicated feed of your most recent work to keep you focused on what's next.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7
- **Styling**: Tailwind CSS 4 (Vanilla CSS variables for maximum flexibility)
- **Animations**: Framer Motion (Fluid transitions and hover effects)
- **Backend/DB**: Firebase (Firestore, Authentication)
- **Icons**: Lucide React
- **Utils**: date-fns (Precise date formatting)

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```

---

## 🎨 Design System
The app utilizes a custom **Glassmorphism** design system:
- **Rich Aesthetics**: Vibrant gradients, subtle micro-animations, and sleek dark modes.
- **Dynamic Layout**: Responsive sidebars and a centralized "Gallery" style main workspace.
- **Performance**: Optimized for fast page load times and butter-smooth scrolling.

---

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
