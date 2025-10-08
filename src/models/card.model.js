import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
    title: {type: String},
    description: {type: String},
    listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
    position: {type: Number},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    labels: [String],
    dueDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},{ 
    timestamps: true,
    versionKey: false,
});
const Card = mongoose.model("Card", cardSchema);

export default Card;