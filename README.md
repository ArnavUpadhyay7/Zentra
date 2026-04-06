# Zentra - Spatial Audio World

A **zero-friction** 2D spatial audio multiplayer platform where users can instantly join and communicate with others only when they are physically close in the virtual space.

## ✨ Key Features

- **Zero Onboarding Friction** — One click to create a room, one click to join. No signup, no login.
- **Proximity-Based Spatial Audio** — Voice chat activates automatically when players get close (powered by LiveKit).
- **Real-time Text Chat** — Socket.io based messaging visible only to nearby players.
- **Smooth 2D Movement** — WASD controls with real-time position synchronization using Phaser.js.
- **Fun & Immersive Experience** — Built like a mini virtual hangout space.

## 🚀 Live Demo
**[Try Zentra Now →](https://zentra-space.vercel.app/)**

## 🛠️ Tech Stack

- **Frontend/Game Engine**: Phaser.js
- **Spatial Audio**: LiveKit (WebRTC)
- **Real-time Communication**: Socket.io
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (Frontend) + Render (Backend)

## 🎯 Why Zentra?

While platforms like Gather.town require accounts and have setup friction, Zentra focuses on **instant access**. You can create or join a room in under 5 seconds and start talking with people nearby — perfect for casual hangouts, study groups, gaming sessions, or quick meetings.

## 🛠️ How It Works

- Players move freely using WASD keys
- When two or more players enter proximity range → spatial voice chat automatically connects
- Text chat is also proximity-based

## 📌 Future Enhancements (Planned)
- Persistent rooms
- Custom avatars and themes
- Room passwords / private rooms
- Better moderation with reporting system

## 🧑‍💻 Local Setup

```bash
# Clone the repository
git clone https://github.com/ArnavUpadhyay7/Zentra.git

# Backend
cd backend
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev
📄 License
This project is open for learning and inspiration.

Made with ❤️ by Arnav Upadhyay
