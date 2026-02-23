import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../index.js";

// ===============================
// 🔹 GET SIDEBAR USERS (WITH UNREAD + LAST MESSAGE)
// ===============================
export const getUserForSidebar = async (req, res) => {
  try {
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId },
        { receiverId: myId },
      ],
    }).sort({ createdAt: -1 });

    const userIds = new Set();

    messages.forEach((msg) => {
      if (msg.senderId.toString() === myId.toString()) {
        userIds.add(msg.receiverId.toString());
      } else {
        userIds.add(msg.senderId.toString());
      }
    });

    const users = await User.find({
      _id: { $in: Array.from(userIds) },
    }).select("-password");

    const usersWithMeta = await Promise.all(
      users.map(async (user) => {
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: myId,
          seen: false,
        });

        const lastMessage = await Message.findOne({
          $or: [
            { senderId: user._id, receiverId: myId },
            { senderId: myId, receiverId: user._id },
          ],
        }).sort({ createdAt: -1 });

        return {
          ...user.toObject(),
          unreadCount,
          lastMessage,
        };
      })
    );

    res.status(200).json(usersWithMeta);
  } catch (error) {
    console.log("Error in getUserForSidebar:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 🔹 GET MESSAGES + MARK AS SEEN
// ===============================
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    // Mark messages as seen
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        seen: false,
      },
      { seen: true }
    );

    const senderSocketId = userSocketMap[userToChatId];

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
       from: myId,
     });
    }

    const receiver = await User.findById(userToChatId);

    const isRequestPending = receiver?.messageRequests?.some(
      (id) => id.toString() === myId.toString()
    );

    res.status(200).json({
      messages,
      isRequestPending,
    });
  } catch (error) {
    console.log("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===============================
// 🔹 SEND MESSAGE
// ===============================
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    if (receiver.blockedUsers.includes(senderId)) {
      return res.status(403).json({ message: "You are blocked by this user" });
    }

    const existingChat = await Message.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (!existingChat) {
      if (!receiver.messageRequests.includes(senderId)) {
        receiver.messageRequests.push(senderId);
        await receiver.save();
      }

      return res.status(200).json({
        message: "Message request sent. Waiting for approval.",
      });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      seen: false,
    });

    await newMessage.save();

    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===============================
// 🔹 GET MESSAGE REQUESTS
// ===============================
export const getMessageRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("messageRequests", "-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.messageRequests);
  } catch (error) {
    console.log("Error in getMessageRequests:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 🔹 ACCEPT REQUEST
// ===============================
export const acceptMessageRequest = async (req, res) => {
  try {
    const { id: senderId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.messageRequests = user.messageRequests.filter(
      (requestId) => requestId.toString() !== senderId
    );

    await user.save();

    res.status(200).json({ message: "Message request accepted" });
  } catch (error) {
    console.log("Error in acceptMessageRequest:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 🔹 BLOCK USER
// ===============================
export const blockUser = async (req, res) => {
  try {
    const { id: userToBlock } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.blockedUsers.includes(userToBlock)) {
      user.blockedUsers.push(userToBlock);
    }

    user.messageRequests = user.messageRequests.filter(
      (requestId) => requestId.toString() !== userToBlock
    );

    await user.save();

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.log("Error in blockUser:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};