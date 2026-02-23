import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import crypto from "crypto";
import nodemailer from "nodemailer";


export const signup = async (req, res) => {
    const {fullName, email, password} = req.body
    try{

        if(!fullName || !email || !password){
            return res.status(400).json({message:"All fields are required"})
        }

        if(password.length < 6){
            return res.status(400).json({message:"Passwaord must be at least 6 characters"})  
        }

        const user = await User.findOne({email})
        if(user) return res.status(400).json({message:"Email already exists"})

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new User({
            fullName,
            email,
            password:hashedPassword
        })

        if(newUser){

            generateToken(newUser._id, res)
            await newUser.save()

            res.status(201).json({
                _id:newUser._id,
                fullname:newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic
            })

        } else{
            res.status(400).json({message:"invalid user credentials"})
        }
         
    } catch(error){
        console.log("error is signup Controllre",error.message)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body
    try{
        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message:"invalid credentials"})
        }

        const isPassword = await bcrypt.compare(password, user.password)
        if(!isPassword){
            return res.status(400).json({message:"Incorrect Password"})
        }

        generateToken(user._id, res)

        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic
        })
        
    }catch(error){
       console.log("Error in login controller", error.message)
       res.status(500).json({message:"Internal Server Error"})     
    }

}

export const logout = async (req, res) => {
    try{
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"logged out succesfully"})

    }catch(error){
        console.log("error in logout controller",error.message)
        res.status(500).json({message:"Internal Server Error"})
    }

}

export const updateProfile = async (req, res) => {
    try{
        const { profilePic } = req.body
        const userId = req.user._id

        if(!profilePic){
            return res.status(400).json({message:"Profile pic is required"})
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updatedUser = await User.findByIdAndUpdate(userId,
            {profilePic: uploadResponse.secure_url},
            {new: true}
        )

        res.status(200).json(updatedUser)

    } catch (error){
        console.log("error in update profile:", error);
        res.status(500).json({ message: "Internal server error" })
    }
}

export const checkAuth = (req, res) => {
    try{
        res.status(200).json(req.user)
    }catch (error){
        console.log("Error in checkAuth controller", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

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

// 🔐 FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset",
      html: `
        <h3>Password Reset</h3>
        <p>Click below to reset your password:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>Link expires in 15 minutes.</p>
      `,
    });

    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    console.log("Forgot password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔁 RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token invalid or expired" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.log("Reset password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};