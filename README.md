# 💬 ChatApp – Real-Time Full Stack Messaging App

A modern full-stack real-time messaging application built using the MERN stack with Socket.io for instant communication.

---

## 🚀 Features

- 🔐 JWT Authentication with secure HTTP-only cookies  
- 👤 Profile Management with image upload (Cloudinary)  
- 💬 Real-time private messaging (Socket.io)  
- 📩 Message Requests (Instagram-style)  
- 🚫 Block Users  
- 🔔 Unread message badge counter  
- ✔ Seen indicator (real-time sync)  
- ✍️ Typing indicator  
- 🔍 Search users by email or name  
- 📷 Image sharing inside chat  
- 📱 Fully responsive UI (TailwindCSS + DaisyUI)  

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- Zustand (State Management)
- Tailwind CSS + DaisyUI
- Axios
- Socket.io Client

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Socket.io
- Cloudinary (Image Storage)

---

## 🧠 Architecture Highlights

- Real-time message delivery via WebSockets
- Proper private chat isolation (no message leakage)
- Message request locking system
- Unread message counter logic
- Seen status synchronization using socket events
- Online user tracking system

---

## 📂 Project Structure

```
ChatApp/
├── Backend/
└── Frontend/
```

---

## ⚙️ Environment Variables

Create a `.env` file inside **Backend/**

```
PORT=5001
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## 🧪 Run Locally

### Backend

```
cd Backend
npm install
npm run dev
```

### Frontend

```
cd Frontend
npm install
npm run dev
```

---

## 🎯 Future Improvements

- Forgot Password (Email Reset Flow)
- Message Reactions ❤️🔥😂
- Voice Notes
- Delete Message (For Me / For Everyone)
- Deployment (Render + Vercel)

---

## 👨‍💻 Author

**Raj Tomar**