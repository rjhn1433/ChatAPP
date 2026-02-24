import express from 'express'
import { protectRoute } from '../middleware/auth.middleware.js'
import {
  getUserForSidebar,
  getMessages,
  sendMessage,
  getMessageRequests,
  acceptMessageRequest,
  blockUser
} from "../controller/message.controller.js";

const router = express.Router();

router.get('/users', protectRoute, getUserForSidebar)
router.post('/send/:id', protectRoute, sendMessage)
router.get("/requests", protectRoute, getMessageRequests);
router.post("/accept/:id", protectRoute, acceptMessageRequest);
router.put("/block/:id", protectRoute, blockUser);
router.get('/:id', protectRoute, getMessages)

export default router