import mongoose from "mongoose";

const labelSchema = new mongoose.Schema({
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    name: { type: String },
    color: { type: String }
},{ 
    timestamps: true,
    versionKey: false,
});
const Label = mongoose.model("Label", labelSchema);

export default Label;