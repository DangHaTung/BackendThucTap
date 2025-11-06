import e from "express";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==================== REGISTER ====================
export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Kiểm tra đầy đủ thông tin
    if (!email || !username || !password) {
      return res.status(400).json({ message: "Email, username và mật khẩu là bắt buộc" });
    }

    // Kiểm tra email đã tồn tại chưa
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: `Đã tồn tại ${email}, vui lòng đổi email khác` });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const user = await User.create({
      email,
      username,
      password: hashPassword
    });

    user.password = undefined; // không trả password về frontend

    return res.status(201).json({
      message: "Đăng ký thành công",  
      data: user
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

// ==================== LOGIN ====================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // So sánh password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo token JWT, thêm username và email
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET || "123456",
      { expiresIn: "2h" }
    );

    user.password = undefined;

    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      data: {
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==================== ME (GET CURRENT USER) ====================
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id username email avatar createdAt updatedAt");
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE ME ====================
export const updateMe = async (req, res) => {
  try {
    const { username, avatar, password, currentPassword } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (avatar !== undefined) updates.avatar = avatar;

    if (password) {
      // Nếu có thay đổi mật khẩu, cần kiểm tra mật khẩu hiện tại
      if (!currentPassword) {
        return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại để thay đổi mật khẩu" });
      }
      
      // Lấy user với password để kiểm tra
      const user = await User.findById(req.user.id).select("+password");
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      
      // Kiểm tra mật khẩu hiện tại
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
      }
      
      // Hash mật khẩu mới
      const hashPassword = await bcrypt.hash(password, 10);
      updates.password = hashPassword;
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, select: "_id username email avatar createdAt updatedAt" }
    );
    if (!updated) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
