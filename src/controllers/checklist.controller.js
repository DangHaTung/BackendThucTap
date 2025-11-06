import { Checklist, ChecklistItem } from "../models/checklist.model.js";
import Card from "../models/card.model.js";
import List from "../models/list.model.js";
import Board from "../models/board.model.js";

// Lấy tất cả checklist của một card
export const getChecklistsByCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    
    const list = await List.findById(card.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền truy cập" });
    
    const checklists = await Checklist.find({ cardId })
      .populate('items')
      .sort({ position: 1, createdAt: 1 });
    
    return res.json(checklists);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Tạo checklist mới
export const createChecklist = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    
    const list = await List.findById(card.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền truy cập" });
    
    // Lấy position tiếp theo
    const maxPos = await Checklist.find({ cardId }).sort({ position: -1 }).limit(1);
    const nextPosition = maxPos.length ? (maxPos[0].position || 0) + 1 : 0;
    
    const checklist = await Checklist.create({
      title: title || "Checklist",
      cardId,
      position: nextPosition
    });
    
    const populatedChecklist = await Checklist.findById(checklist._id).populate('items');
    return res.status(201).json(populatedChecklist);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Cập nhật checklist
export const updateChecklist = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập
    const checklist = await Checklist.findById(checklistId).populate('cardId');
    if (!checklist) return res.status(404).json({ message: "Không tìm thấy danh sách kiểm tra" });
    
    const card = await Card.findById(checklist.cardId._id);
    if (!card) return res.status(404).json({ message: "Thẻ không hợp lệ" });
    
    const list = await List.findById(card.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền truy cập" });
    
    const updated = await Checklist.findByIdAndUpdate(
      checklistId,
      { $set: { title } },
      { new: true }
    ).populate('items');
    
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Xóa checklist
export const deleteChecklist = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập
    const checklist = await Checklist.findById(checklistId).populate('cardId');
    if (!checklist) return res.status(404).json({ message: "Không tìm thấy danh sách kiểm tra" });
    
    const card = await Card.findById(checklist.cardId._id);
    if (!card) return res.status(404).json({ message: "Thẻ không hợp lệ" });

    const list = await List.findById(card.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền truy cập" });
    
    // Xóa tất cả items trong checklist
    await ChecklistItem.deleteMany({ _id: { $in: checklist.items } });
    
    // Xóa checklist
    await Checklist.findByIdAndDelete(checklistId);
    
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Tạo checklist item mới
export const createChecklistItem = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập
    const checklist = await Checklist.findById(checklistId).populate('cardId');
    if (!checklist) return res.status(404).json({ message: "Không tìm thấy danh sách kiểm tra" });
    
    const card = await Card.findById(checklist.cardId._id);
    if (!card) return res.status(404).json({ message: "Thẻ không hợp lệ" });
    
    const list = await List.findById(card.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền truy cập" });
    
    // Lấy position tiếp theo
    const maxPos = await ChecklistItem.find({ _id: { $in: checklist.items } }).sort({ position: -1 }).limit(1);
    const nextPosition = maxPos.length ? (maxPos[0].position || 0) + 1 : 0;
    
    const item = await ChecklistItem.create({
      text: text || "New item",
      position: nextPosition
    });
    
    // Thêm item vào checklist
    await Checklist.findByIdAndUpdate(checklistId, {
      $push: { items: item._id }
    });
    
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Cập nhật checklist item
export const updateChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { text, completed } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập thông qua checklist
    const checklist = await Checklist.findOne({ items: itemId }).populate('cardId');
    if (!checklist) return res.status(404).json({ message: "Không tìm thấy mục kiểm tra" });
    
    const card = await Card.findById(checklist.cardId._id);
    if (!card) return res.status(404).json({ message: "Thẻ không hợp lệ" });
    
    const list = await List.findById(card.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền truy cập" });
    
    const update = {};
    if (text !== undefined) update.text = text;
    if (completed !== undefined) update.completed = completed;
    
    const updated = await ChecklistItem.findByIdAndUpdate(
      itemId,
      { $set: update },
      { new: true }
    );
    
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Xóa checklist item
export const deleteChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập thông qua checklist
    const checklist = await Checklist.findOne({ items: itemId }).populate('cardId');
    if (!checklist) return res.status(404).json({ message: "Không tìm thấy mục kiểm tra" });
    
    const card = await Card.findById(checklist.cardId._id);
    if (!card) return res.status(404).json({ message: "Thẻ không hợp lệ" });
    
    const list = await List.findById(card.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền truy cập" });
    
    // Xóa item khỏi checklist
    await Checklist.findByIdAndUpdate(checklist._id, {
      $pull: { items: itemId }
    });
    
    // Xóa item
    await ChecklistItem.findByIdAndDelete(itemId);
    
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

