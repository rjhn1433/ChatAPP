import { Server } from "socket.io";

let io;
const userSocketMap = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { senderId: userId });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStoppedTyping", { senderId: userId });
      }
    });

    socket.on("markDelivered", ({ messageId, senderId }) => {
        const senderSocketId = userSocketMap[senderId];
        if(senderSocketId) {
            io.to(senderSocketId).emit("messageDelivered", { messageId });
        }
    });

    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

export { io, userSocketMap };