import Card from "../models/card.model.js";
import List from "../models/list.model.js";
import Board from "../models/board.model.js";

export const getCardsByList = async (req, res) => {
  try {
    const { listId } = req.params;
    const cards = await Card.find({ listId }).sort({ position: 1, createdAt: 1 });
    return res.json(cards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId, listId } = req.params;
    // Ensure user is member of the board and list belongs to board
    const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(404).json({ message: "Board không tồn tại hoặc không có quyền" });
    const list = await List.findOne({ _id: listId, boardId });
    if (!list) return res.status(404).json({ message: "List không hợp lệ" });
    const maxPos = await Card.find({ listId }).sort({ position: -1 }).limit(1);
    const nextPosition = maxPos.length ? (maxPos[0].position || 0) + 1 : 0;
    const card = await Card.create({
      title: req.body.title || "New Card",
      description: req.body.description || "",
      listId,
      position: nextPosition,
      createdBy: userId,
      labels: req.body.labels || [],
      dueDate: req.body.dueDate || null,
    });
    return res.status(201).json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    // ensure user is member of the board that owns this card
    const existing = await Card.findById(cardId);
    if (!existing) return res.status(404).json({ message: "Không tìm thấy card" });
    const list = await List.findById(existing.listId);
    if (!list) return res.status(404).json({ message: "List không hợp lệ" });
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền" });
    const update = {};
    ["title", "description", "labels", "assignees", "dueDate"].forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    const card = await Card.findByIdAndUpdate(cardId, { $set: update }, { new: true });
    if (!card) return res.status(404).json({ message: "Không tìm thấy card" });
    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const existing = await Card.findById(cardId);
    if (!existing) return res.status(404).json({ message: "Không tìm thấy card" });
    const list = await List.findById(existing.listId);
    if (!list) return res.status(404).json({ message: "List không hợp lệ" });
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền" });
    const removed = await Card.findByIdAndDelete(cardId);
    if (!removed) return res.status(404).json({ message: "Không tìm thấy card" });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const moveCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { targetListId, targetPosition } = req.body;
    if (!targetListId || targetPosition === undefined) {
      return res.status(400).json({ message: "Thiếu targetListId hoặc targetPosition" });
    }
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: "Không tìm thấy card" });
    // ensure permission on both source and target lists via board membership
    const sourceList = await List.findById(card.listId);
    const targetList = await List.findById(targetListId);
    if (!sourceList || !targetList) return res.status(404).json({ message: "List không hợp lệ" });
    const sourceBoard = await Board.findOne({ _id: sourceList.boardId, $or: [{ owner: userId }, { members: userId }] });
    const targetBoard = await Board.findOne({ _id: targetList.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!sourceBoard || !targetBoard || String(sourceBoard._id) !== String(targetBoard._id)) {
      return res.status(403).json({ message: "Không có quyền hoặc khác board" });
    }

    // Reorder positions in source list
    await Card.updateMany(
      { listId: card.listId, position: { $gt: card.position } },
      { $inc: { position: -1 } }
    );

    // Shift positions in target list
    await Card.updateMany(
      { listId: targetListId, position: { $gte: targetPosition } },
      { $inc: { position: 1 } }
    );

    // Move card
    card.listId = targetListId;
    card.position = targetPosition;
    await card.save();

    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


