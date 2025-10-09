import e from 'express';
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export const register = async (req,res) =>{
  try {
    // Kiểm tra tài khoản đã tồn tại
    const userExist = await User.findOne({email: req.body.email});
    if(userExist){
      return res.status(400).json({message: `Đã tồn tại ${req.body.email}, vui lòng đổi email khác`})
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashPassword

    const user = await User.create(req.body)
    user.password = undefined;

    return res.status(201).json({
      message: "Đăng ký thành công",
      data: user
    })
    
  } catch (error) {
    console.log(error);
    
    return res.status(500).json({message: error.message})
  }
}

export const login = async (req, res) => {
  try {
    const user = await User.findOne({email: req.body.email}).select("+password");
    if(!user){
      return res.status(400).json({message: "Tài Khoản hoặc mật khẩu không đúng"});
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password)
    if(!isMatch){
      return res.status(400).json({message: "Tài Khoản hoặc mật khẩu không đúng"});
    }
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET || "123456", {expiresIn: "2h"});
    user.password = undefined;
    return res.status(200).json({
      message: "Đăng nhập thành công", token, data: user})
  }catch (error) {
    return res.status(500).json({message: error.message})
  }
}