import List from "../models/list.model.js";
import Board from "../models/board.model.js";

export const getListsByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const lists = await List.find({ boardId }).sort({ position: 1, createdAt: 1 });
    return res.json(lists);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId } = req.params;
    const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(404).json({ message: "Board không tồn tại hoặc không có quyền" });
    const maxPos = await List.find({ boardId }).sort({ position: -1 }).limit(1);
    const nextPosition = maxPos.length ? (maxPos[0].position || 0) + 1 : 0;
    const list = await List.create({ title: req.body.title || "New List", boardId, position: nextPosition });
    return res.status(201).json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateList = async (req, res) => {
  try {
    const { boardId, listId } = req.params;
    const list = await List.findOneAndUpdate(
      { _id: listId, boardId },
      { $set: { title: req.body.title } },
      { new: true }
    );
    if (!list) return res.status(404).json({ message: "Không tìm thấy list" });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteList = async (req, res) => {
  try {
    const { boardId, listId } = req.params;
    const removed = await List.findOneAndDelete({ _id: listId, boardId });
    if (!removed) return res.status(404).json({ message: "Không tìm thấy list" });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


