import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateTokens } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("jwt", accessToken, {
    httpOnly: true,
    secure: true, // required for HTTPS
    sameSite: "none",
    path: "/", 
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie("jwt_refresh", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/", 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to,
          subject,
          html,
        });
    } catch (err) {
        console.log("Email sending error:", err);
    }
};

export const signup = async (req, res) => {
    const {fullName, email, password} = req.body;
    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }

        if(password.length < 6){
            return res.status(400).json({message:"Password must be at least 6 characters"});  
        }

        const user = await User.findOne({email});
        if(user) return res.status(400).json({message:"Email already exists"});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            verificationToken: hashedVerificationToken,
            verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        if(newUser){
            const { accessToken, refreshToken } = generateTokens(newUser._id);
            newUser.refreshTokens.push(refreshToken);
            
            await newUser.save();
            setAuthCookies(res, accessToken, refreshToken);

            // Send Verification Email
            const verifyURL = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
            await sendEmail(
                newUser.email, 
                "Verify your Whisper Account", 
                `<h3>Welcome to Whisper!</h3><p>Please click the link below to verify your email:</p><a href="${verifyURL}">${verifyURL}</a>`
            );

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
                bio: newUser.bio,
                theme: newUser.theme,
                isVerified: newUser.isVerified
            });

        } else{
            res.status(400).json({message:"Invalid user credentials"});
        }
         
    } catch(error){
        console.log("Error in signup Controller", error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const login = async (req, res) => {
    const {email, password} = req.body;
    try{
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const isPassword = await bcrypt.compare(password, user.password);
        if(!isPassword){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const { accessToken, refreshToken } = generateTokens(user._id);
        
        user.refreshTokens.push(refreshToken);
        await user.save();
        
        setAuthCookies(res, accessToken, refreshToken);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            bio: user.bio,
            theme: user.theme,
            isVerified: user.isVerified
        });
        
    }catch(error){
       console.log("Error in login controller", error.message);
       res.status(500).json({message:"Internal Server Error"});     
    }
};

export const logout = async (req, res) => {
    try{
        const refreshToken = req.cookies.jwt_refresh;
        if(req.user && refreshToken) {
            req.user.refreshTokens = req.user.refreshTokens.filter(rt => rt !== refreshToken);
            await req.user.save();
        }

        res.cookie("jwt", "", { httpOnly: true, secure: true, sameSite: "none", path: "/", expires: new Date(0) });
        res.cookie("jwt_refresh", "", { httpOnly: true, secure: true, sameSite: "none", path: "/", expires: new Date(0) });
        res.status(200).json({message:"Logged out successfully"});

    }catch(error){
        console.log("Error in logout controller", error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const logoutAll = async (req, res) => {
    try{
        if(req.user) {
            req.user.refreshTokens = [];
            await req.user.save();
        }
        res.cookie("jwt", "", { httpOnly: true, secure: true, sameSite: "none", path: "/", expires: new Date(0) });
        res.cookie("jwt_refresh", "", { httpOnly: true, secure: true, sameSite: "none", path: "/", expires: new Date(0) });
        res.status(200).json({message:"Logged out of all devices successfully"});

    }catch(error){
        console.log("Error in logoutAll controller", error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const refreshToken = async (req, res) => {
    try {
        const rToken = req.cookies.jwt_refresh;
        if (!rToken) return res.status(401).json({ message: "No refresh token" });

        const decoded = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh");
        const user = await User.findById(decoded.userId);

        if (!user || !user.refreshTokens.includes(rToken)) {
            // Token rotation / reuse detected
            if (user) {
                user.refreshTokens = [];
                await user.save();
            }
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

        user.refreshTokens = user.refreshTokens.filter(rt => rt !== rToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();

        setAuthCookies(res, accessToken, newRefreshToken);
        res.status(200).json({ message: "Token refreshed" });
    } catch (error) {
        console.log("Refresh token error:", error.message);
        res.status(403).json({ message: "Invalid refresh token" });
    }
};

export const updateProfile = async (req, res) => {
    try{
        const { profilePic, bio, theme } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if(profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            updateData.profilePic = uploadResponse.secure_url;
        }
        if(bio !== undefined) updateData.bio = bio;
        if(theme !== undefined) updateData.theme = theme;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {new: true}).select("-password");

        res.status(200).json(updatedUser);

    } catch (error){
        console.log("error in update profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const checkAuth = (req, res) => {
    try{
        res.status(200).json(req.user);
    }catch (error){
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query)
      return res.status(400).json({ message: "Search query required" });

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { email: { $regex: query, $options: "i" } },
            { fullName: { $regex: query, $options: "i" } },
          ],
        },
      ],
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in searchUsers:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail(user.email, "Password Reset", `<h3>Password Reset</h3><p>Click below to reset your password:</p><a href="${resetURL}">${resetURL}</a><p>Link expires in 15 minutes.</p>`);

    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    console.log("Forgot password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token invalid or expired" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Invalidate all refresh tokens on password reset
    user.refreshTokens = [];
    
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.log("Reset password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        if(newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // Optionally invalidate other sessions
        const currentRefreshToken = req.cookies.jwt_refresh;
        user.refreshTokens = currentRefreshToken ? [currentRefreshToken] : [];
        
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.log("Change password error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: "Token invalid or expired" });

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.log("Verify email error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};