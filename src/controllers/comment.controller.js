import Comment from "../models/comment.model.js";

export const getComments = async (req, res) => {
  try {
    const { cardId } = req.params;
    const comments = await Comment.find({ cardId }).sort({ createdAt: 1 });
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
    return res.status(201).json(comment);
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
    );
    if (!comment) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    return res.json(comment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const removed = await Comment.findOneAndDelete({ _id: commentId, author: userId });
    if (!removed) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


