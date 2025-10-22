import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
},{ 
    timestamps: true,
    versionKey: false,
});
const Comment = mongoose.model("Comment", commentSchema);

export default Comment;