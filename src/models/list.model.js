import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
    title: {type: String},
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    position: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},{ 
    timestamps: true,
    versionKey: false,
});
const List = mongoose.model("List", listSchema);

export default List;