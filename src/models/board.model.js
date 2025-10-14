import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
    title: {type: String, default: "New Board"},
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},{ 
    timestamps: true,
    versionKey: false,
});
const Board = mongoose.model("Board", boardSchema);

export default Board;