import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { OTPService } from '../services/otpService.js';

const tempUsers = new Map();

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
};


export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
 
    // Generate OTP
    const otp = OTPService.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    tempUsers.set(email, {
      username,
      email,
      password,
      otp,
      otpExpiry,
      otpAttempts: 0,
      createdAt: Date.now()
    });

    console.log(`[AUTH] Registration OTP for ${email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent. Please verify to complete registration.',
      email,
      otp,
      otpExpiry: otpExpiry.toISOString()
    });
  } catch (error) {
    console.error('[AUTH] Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Get temp user data
    const tempUser = tempUsers.get(email);
    if (!tempUser) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please register again.'
      });
    }

    // Check if temp user data expired (30 minutes)
    if (Date.now() - tempUser.createdAt > 30 * 60 * 1000) {
      tempUsers.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please register again.'
      });
    }

    // Check if OTP is expired
    if (OTPService.isOTPExpired(tempUser.otpExpiry)) {
      tempUsers.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please register again.'
      });
    }

    // Check OTP attempts
    if (tempUser.otpAttempts >= 3) {
      tempUsers.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please register again.'
      });
    }

    // Verify OTP
    if (tempUser.otp !== otp) {
      tempUser.otpAttempts += 1;
      const remainingAttempts = 3 - tempUser.otpAttempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        remainingAttempts
      });
    }

    // OTP verified - create user
    const user = await User.create({
      username: tempUser.username,
      email: tempUser.email,
      password: tempUser.password,
      isVerified: true
    });

    // Clean up temp data
    tempUsers.delete(email);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account verified and created successfully!',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.'
      });
    }

    // Check if OTP locked
    if (user.isOtpLocked && OTPService.isAccountLocked(user.otpLockUntil)) {
      const remainingTime = OTPService.getRemainingLockTime(user.otpLockUntil);
      return res.status(403).json({
        success: false,
        message: `Account is locked. Please try again after ${Math.ceil(remainingTime / 60000)} minutes.`,
        lockUntil: user.otpLockUntil
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment OTP attempts for password failures
      user.otpAttempts += 1;
      
      // Lock account if attempts >= 3
      if (user.otpAttempts >= 3) {
        user.isOtpLocked = true;
        user.otpLockCount = (user.otpLockCount || 0) + 1;
        const lockDuration = OTPService.getLockDuration(user.otpLockCount);
        user.otpLockUntil = new Date(Date.now() + lockDuration);
        user.otpAttempts = 0; // Reset attempts after lock
        await user.save();
        
        return res.status(403).json({
          success: false,
          message: `Account locked for ${lockDuration / 60000} minutes due to multiple failed attempts.`,
          lockUntil: user.otpLockUntil
        });
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        remainingAttempts: 3 - user.otpAttempts
      });
    }

    // Password correct - reset OTP attempts
    user.otpAttempts = 0;
    user.isOtpLocked = false;
    user.otpLockUntil = null;
    user.status = 'online';
    user.lastSeen = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const tempUser = tempUsers.get(email);
    if (!tempUser) {
      return res.status(400).json({
        success: false,
        message: 'No registration session found. Please register again.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      tempUsers.delete(email);
      return res.status(400).json({
        success: false,
        message: 'User already registered. Please login.'
      });
    }

    // Generate new OTP
    const otp = OTPService.generateOTP();
    tempUser.otp = otp;
    tempUser.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    tempUser.otpAttempts = 0;

    // Send new OTP
    console.log(`[AUTH] Resent OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'New OTP sent successfully.',
      otp,
      otpExpiry: tempUser.otpExpiry.toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { 
      status: 'offline',
      lastSeen: Date.now()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};