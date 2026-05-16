import express from 'express';
import { 
    login, 
    logout, 
    logoutAll,
    signup, 
    updateProfile, 
    checkAuth, 
    searchUsers, 
    forgotPassword, 
    resetPassword,
    changePassword,
    verifyEmail,
    refreshToken
} from '../controller/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protectRoute, logout);
router.post('/logout-all', protectRoute, logoutAll);
router.post('/refresh', refreshToken);

router.get('/verify-email/:token', verifyEmail);

router.put('/update-profile', protectRoute, updateProfile);
router.put('/change-password', protectRoute, changePassword);

router.get('/check', protectRoute, checkAuth);
router.get("/search", protectRoute, searchUsers);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;