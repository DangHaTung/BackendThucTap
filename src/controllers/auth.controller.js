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
