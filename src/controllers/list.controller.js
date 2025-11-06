import List from "../models/list.model.js";
import Board from "../models/board.model.js";

export const getListsByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const lists = await List.find({ boardId, archived: false }).sort({ position: 1, createdAt: 1 });
    return res.json(lists);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId } = req.params;
    
    // Get board with full info
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Bảng không tồn tại" });
    
    // Check if user is board member
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) return res.status(403).json({ message: "Không phải thành viên của Bảng công việc" });
    
    // Check if user can create list - Only owner or board admin can create
    const isBoardOwner = String(board.owner) === userId;
    const isBoardAdmin = board.admins && board.admins.some(a => String(a) === userId);
    
    if (!isBoardOwner && !isBoardAdmin) {
      return res.status(403).json({ message: "Chỉ chủ sở hữu hoặc admin của Bảng công việc mới có thể tạo danh sách" });
    }
    
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
    const userId = req.user.id;
    const { boardId, listId } = req.params;
    
    // Get board
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Bảng không tồn tại" });
    
    // Check if user is board member
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) return res.status(403).json({ message: "Không phải thành viên của Bảng công việc" });
    
    // Check if user can update list - Only owner or board admin can update
    const isBoardOwner = String(board.owner) === userId;
    const isBoardAdmin = board.admins && board.admins.some(a => String(a) === userId);
    
    if (!isBoardOwner && !isBoardAdmin) {
      return res.status(403).json({ message: "Chỉ chủ sở hữu hoặc admin của Bảng công việc mới có thể cập nhật danh sách" });
    }
    
    const list = await List.findOneAndUpdate(
      { _id: listId, boardId },
      { $set: { title: req.body.title } },
      { new: true }
    );
    if (!list) return res.status(404).json({ message: "Không tìm thấy danh sách" });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteList = async (req, res) => {
  try {
    const { boardId, listId } = req.params;
    const userId = req.user.id;
    
    // Get board
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Bảng không tồn tại" });
    
    // Check if user is board member
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) return res.status(403).json({ message: "Không phải thành viên của Bảng công việc" });
    
    // Check if user can delete list - Only owner or board admin can delete
    const isBoardOwner = String(board.owner) === userId;
    const isBoardAdmin = board.admins && board.admins.some(a => String(a) === userId);
    
    if (!isBoardOwner && !isBoardAdmin) {
      return res.status(403).json({ message: "Chỉ chủ sở hữu hoặc admin của Bảng công việc mới có thể Lưu trữ danh sách này" });
    }
    
    // Archive list thay vì xóa
    const archivedList = await List.findOneAndUpdate(
      { _id: listId, boardId },
      { 
        $set: { 
          archived: true, 
          archivedAt: new Date() 
        } 
      },
      { new: true }
    );
    
    if (!archivedList) return res.status(404).json({ message: "Không tìm thấy danh sách" });
    
    // Archive tất cả card trong list này
    const Card = (await import("../models/card.model.js")).default;
    await Card.updateMany(
      { listId },
      { 
        $set: { 
          archived: true, 
          archivedAt: new Date() 
        } 
      }
    );
    
    return res.json({ message: "Danh sách đã được lưu trữ thành công" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const restoreList = async (req, res) => {
  try {
    const { boardId, listId } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập
    const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(404).json({ message: "Bảng không tồn tại hoặc không có quyền truy cập" });
    
    // Restore list
    const restoredList = await List.findOneAndUpdate(
      { _id: listId, boardId },
      { 
        $set: { 
          archived: false, 
          archivedAt: null 
        } 
      },
      { new: true }
    );
    
    if (!restoredList) return res.status(404).json({ message: "Không tìm thấy danh sách" });
    
    // Restore tất cả card trong list này
    const Card = (await import("../models/card.model.js")).default;
    await Card.updateMany(
      { listId },
      { 
        $set: { 
          archived: false, 
          archivedAt: null 
        } 
      }
    );
    
    return res.json({ message: "Danh sách đã được khôi phục thành công" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getArchivedLists = async (req, res) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập
    const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(404).json({ message: "Bảng không tồn tại hoặc không có quyền truy cập" });
    
    const archivedLists = await List.find({ boardId, archived: true }).sort({ archivedAt: -1 });
    return res.json(archivedLists);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


