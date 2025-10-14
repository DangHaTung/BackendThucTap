import mongoose from "mongoose";

const boardInvitationSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "Board ID là bắt buộc"],
    },
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người mời là bắt buộc"],
    },
    inviteeEmail: {
      type: String,
      required: [true, "Email người được mời là bắt buộc"],
      trim: true,
    },
    inviteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Sẽ được set khi người được mời đăng ký
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index để tối ưu truy vấn
boardInvitationSchema.index({ inviteeEmail: 1, status: 1 });
boardInvitationSchema.index({ boardId: 1, status: 1 });

const BoardInvitation = mongoose.model("BoardInvitation", boardInvitationSchema);

export default BoardInvitation;
