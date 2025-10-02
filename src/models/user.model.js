import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Tên người dùng là bắt buộc"],
    },
    email: {
        type: String,
        required: [true, "Email là bắt buộc"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Mật khẩu là bắt buộc"],
        select: false 
    }
}, {
         timeStamp:true,
         versionKey: false
})

const User = mongoose.model("User", userSchema);

export default User;