import Comment from "../models/comment.model.js";
import { logCardActivity } from "./activity.controller.js";

export const getComments = async (req, res) => {
  try {
    const { cardId } = req.params;
    const comments = await Comment.find({ cardId })
      .populate('author', 'username email')
      .sort({ createdAt: 1 });
    return res.json(comments);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { text } = req.body;
    
    
    if (!text) return res.status(400).json({ message: "Thiếu nội dung bình luận" });
    
    const comment = await Comment.create({ cardId, author: userId, text });
    
    const populatedComment = await Comment.findById(comment._id).populate('author', 'username email');
    
    // Log activity
    const io = req.app.get('io');
    await logCardActivity('comment_added', cardId, userId, {
      commentId: comment._id,
      commentText: text
    }, io);
    
    // Emit Socket.IO event to all clients in the card room (including sender)
    if (io) {
      io.to(`card-${cardId}`).emit('comment-added', {
        comment: populatedComment,
        user: {
          _id: userId,
          username: req.user.username
        }
      });
    }
    
    return res.status(201).json(populatedComment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, author: userId },
      { $set: { text: req.body.text } },
      { new: true }
    ).populate('author', 'username email');
    if (!comment) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    
    // Log activity
    const io = req.app.get('io');
    await logCardActivity('comment_updated', comment.cardId, userId, {
      commentId: comment._id,
      commentText: req.body.text
    }, io);
    
    // Emit Socket.IO event to all clients in the card room (including sender)
    if (io) {
      io.to(`card-${comment.cardId}`).emit('comment-updated', {
        comment: comment,
        user: {
          _id: userId,
          username: req.user.username
        }
      });
    }
    
    return res.json(comment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    
    // Get comment info before deletion for Socket.IO
    const commentToDelete = await Comment.findById(commentId);
    if (!commentToDelete) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }
    
    const removed = await Comment.findOneAndDelete({ _id: commentId, author: userId });
    if (!removed) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    
    // Log activity
    const io = req.app.get('io');
    await logCardActivity('comment_deleted', commentToDelete.cardId, userId, {
      commentId: commentId,
      commentText: commentToDelete.text
    }, io);
    
    // Emit Socket.IO event to all clients in the card room (including sender)
    if (io) {
      io.to(`card-${commentToDelete.cardId}`).emit('comment-deleted', {
        commentId: commentId,
        user: {
          _id: userId,
          username: req.user.username
        }
      });
    }
    
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};