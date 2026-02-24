import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST

import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

/* ================= CORS CONFIG ================= */

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // production frontend
];

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  console.log("User connected:", userId);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Typing Indicator
  socket.on("typing", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping");
    }
  });

  socket.on("stopTyping", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping");
    }
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

/* ================= MIDDLEWARE ================= */

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log("Server running on PORT:", PORT);
  connectDB();
});

/* ================= EXPORTS ================= */

export { io, userSocketMap };