import { Server } from "socket.io";

let io;
const userSocketMap = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap[userId] = socket.id;
    }

    socket.on("disconnect", () => {
      delete userSocketMap[userId];
    });
  });

  return io;
};

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

export { io };