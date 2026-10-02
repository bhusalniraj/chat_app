import { User } from '../models/User.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username email avatar status lastSeen about')
      .sort({ username: 1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q || req.query.query || '';
    if (!query.trim()) {
      return res.json({ success: true, users: [] });
    }

    const regex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: regex }, { email: regex }]
    }).select('username email avatar status lastSeen about');

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

export const updateProfile = async (req, res) => {
  try {
    const updates = {};
    if (req.body.username) updates.username = req.body.username.trim();
    if (req.body.about !== undefined) updates.about = req.body.about.trim();

    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: req.user._id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
