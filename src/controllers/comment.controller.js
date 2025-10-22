import Comment from "../models/comment.model.js";

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
    
    console.log('Creating comment:', { userId, cardId, text });
    
    if (!text) return res.status(400).json({ message: "Thiếu nội dung bình luận" });
    
    const comment = await Comment.create({ cardId, author: userId, text });
    console.log('Comment created:', comment);
    
    const populatedComment = await Comment.findById(comment._id).populate('author', 'username email');
    console.log('Comment populated:', populatedComment);
    
    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting Socket.IO event for card:', cardId);
      io.to(`card-${cardId}`).emit('comment-added', {
        comment: populatedComment,
        user: {
          _id: userId,
          username: req.user.username
        }
      });
    } else {
      console.error('Socket.IO not available');
    }
    
    return res.status(201).json(populatedComment);
  } catch (err) {
    console.error('Error creating comment:', err);
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
    
    // Emit Socket.IO event
    const io = req.app.get('io');
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
    
    // Emit Socket.IO event
    const io = req.app.get('io');
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