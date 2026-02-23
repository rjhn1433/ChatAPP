import express from 'express'
import { login, logout, signup, updateProfile, checkAuth } from '../controller/auth.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'
import { searchUsers } from "../controller/auth.controller.js";
import { forgotPassword, resetPassword } from "../controller/auth.controller.js";

const router = express.Router()


router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)
router.put('/update-profile', protectRoute, updateProfile)
router.get('/check', protectRoute, checkAuth)
router.get("/search", protectRoute, searchUsers);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


export default router;