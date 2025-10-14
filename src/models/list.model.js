import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
    title: {type: String},
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
    position: { type: Number },
    color: { 
      type: String, 
      default: '#f3f4f6',
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
const List = mongoose.model("List", listSchema);

export default List;