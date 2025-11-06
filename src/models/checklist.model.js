import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    position: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false,
});

const ChecklistItem = mongoose.model("ChecklistItem", checklistItemSchema);

const checklistSchema = new mongoose.Schema({
    title: { type: String, required: true },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChecklistItem' }],
    position: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false,
});

const Checklist = mongoose.model("Checklist", checklistSchema);

export { Checklist, ChecklistItem };

