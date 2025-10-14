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
    color: { 
      type: String, 
      default: '#ffffff',
      validate: {
        validator: function(v) {
          return /^#([0-9a-fA-F]{3}){1,2}$/.test(v);
        },
        message: 'Color must be a valid hex color'
      }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},{ 
    timestamps: true,
    versionKey: false,
});
const Card = mongoose.model("Card", cardSchema);

export default Card;