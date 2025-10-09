import Board from "../models/board.model.js";
import User from "../models/user.model.js";

export const getMyBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    const boards = await Board.find({ $or: [{ owner: userId }, { members: userId }] })
      .sort({ updatedAt: -1 });
    return res.json(boards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createBoard = async (req, res) => {
  try {
    const userId = req.user.id;
    const board = await Board.create({
      title: req.body.title || "New Board",
      owner: userId,
      members: [userId],
    });
    return res.status(201).json(board);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getBoardById = async (req, res) => {
  try {
    const userId = req.user.id;
    const board = await Board.findOne({ _id: req.params.id, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(404).json({ message: "Không tìm thấy board" });
    return res.json(board);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateBoard = async (req, res) => {
  try {
    const userId = req.user.id;
    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, owner: userId },
      { $set: { title: req.body.title } },
      { new: true }
    );
    if (!board) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    return res.json(board);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteBoard = async (req, res) => {
  try {
    const userId = req.user.id;
    const removed = await Board.findOneAndDelete({ _id: req.params.id, owner: userId });
    if (!removed) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ message: "Thiếu memberId" });
    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, owner: userId },
      { $addToSet: { members: memberId } },
      { new: true }
    );
    if (!board) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    return res.json(board);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const inviteMemberByEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    const boardId = req.params.id;
    const target = await User.findOne({ email });
    if (!target) return res.status(404).json({ message: "Email không tồn tại" });
    const board = await Board.findOneAndUpdate(
      { _id: boardId, owner: userId },
      { $addToSet: { members: target._id } },
      { new: true }
    );
    if (!board) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    return res.json(board);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.body;
    const boardId = req.params.id;
    const board = await Board.findOneAndUpdate(
      { _id: boardId, owner: userId },
      { $pull: { members: memberId } },
      { new: true }
    );
    if (!board) return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    return res.json(board);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const leaveBoard = async (req, res) => {
  try {
    const userId = req.user.id;
    const boardId = req.params.id;
    // không cho owner leave nếu không có owner mới
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Không tìm thấy board" });
    if (String(board.owner) === String(userId)) {
      return res.status(400).json({ message: "Owner không thể rời board. Hãy chuyển quyền hoặc xóa board." });
    }
    const updated = await Board.findOneAndUpdate(
      { _id: boardId },
      { $pull: { members: userId } },
      { new: true }
    );
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


