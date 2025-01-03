const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user ID:', req.user._id); // Debug log

    const user = await User.findById(req.user._id).select('-password');
    console.log('Found user profile:', user); // Debug log

    if (!user) {
      console.log('User not found in database'); // Debug log
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    const avatar = req.body.avatar;

    const updateData = {
      fullName,
      email,
      phone
    };

    // Nếu có upload ảnh mới
    if (avatar && avatar.length > 10 * 1024 * 1024) { // 10MB in base64
      return res.status(400).json({
        success: false,
        message: 'Image size too large'
      });
    }

    if (avatar && avatar.startsWith('data:image')) {
      try {
        // Upload ảnh lên Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(avatar, {
          folder: 'avatars',
          use_filename: true,
          unique_filename: true,
        });
        updateData.avatar = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image'
        });
      }
    }

    // Tìm và cập nhật user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Nếu có avatar cũ và khác với avatar mặc định, xóa ảnh cũ trên Cloudinary
    if (user.avatar && 
        user.avatar !== 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff' &&
        updateData.avatar) {
      try {
        const publicId = user.avatar.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`avatars/${publicId}`);
      } catch (deleteError) {
        console.error('Error deleting old image:', deleteError);
      }
    }

    // Cập nhật thông tin user
    Object.assign(user, updateData);
    await user.save();

    // Trả về user đã cập nhật (không bao gồm password)
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

exports.getDeliveryStaff = async (req, res) => {
    try {
        const deliveryStaff = await User.find({ 
            role: 'DeliveryStaff',
            // Chỉ lấy những user có đầy đủ thông tin
            fullName: { $exists: true },
            phone: { $exists: true }
        })
        .select('_id username fullName phone email')
        .sort({ fullName: 1 });

        res.json({
            success: true,
            data: deliveryStaff
        });
    } catch (error) {
        console.error('Error fetching delivery staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery staff',
            error: error.message
        });
    }
}; 