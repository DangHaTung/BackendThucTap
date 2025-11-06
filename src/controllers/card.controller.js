import Card from "../models/card.model.js";
import List from "../models/list.model.js";
import Board from "../models/board.model.js";
import User from "../models/user.model.js";
import { logCardActivity } from "./activity.controller.js";

// Helper function: Check if user is admin (includes board owner and board admins)
const isUserAdminOfCard = async (userId, card) => {
  // Board owner is always admin
  const list = await List.findById(card.listId);
  if (!list) return false;
  
  const board = await Board.findById(list.boardId);
  if (!board) return false;
  
  // Check if user is board owner
  const isBoardOwner = String(board.owner) === userId;
  
  // Check if user is board admin
  const isBoardAdmin = board.admins && board.admins.some(id => String(id) === userId);
  
  // Check if user is card admin
  const isCardAdmin = card.admins && card.admins.some(id => String(id) === userId);
  
  return isBoardOwner || isBoardAdmin || isCardAdmin;
};

export const getCardsByList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listId } = req.params;
    
    // Get list and board to check permissions
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ message: "List không tồn tại" });
    
    const board = await Board.findById(list.boardId);
    if (!board) return res.status(404).json({ message: "Board không tồn tại" });
    
    // Check if user is board member
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) {
      return res.status(403).json({ message: "Không phải thành viên của board" });
    }
    
    // All board members can see all cards in the list
    // Permission restrictions apply only to edit/delete operations
    const cards = await Card.find({ listId, archived: false }).sort({ position: 1, createdAt: 1 });
    
    return res.json(cards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId, listId } = req.params;
    
    // Get board with full info
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board không tồn tại" });
    
    // Check if user is board member
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) return res.status(403).json({ message: "Không phải thành viên của board" });
    
    // Check if user can create card - Only owner or board admin can create
    const isBoardOwner = String(board.owner) === userId;
    const isBoardAdmin = board.admins && board.admins.some(a => String(a) === userId);
    
    if (!isBoardOwner && !isBoardAdmin) {
      return res.status(403).json({ message: "Chỉ chủ sở hữu hoặc admin của board mới có thể tạo card" });
    }
    
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
      members: [], // Members mặc định là rỗng
      admins: [userId], // Người tạo card là admin mặc định
    });
    
    // Log activity
    const io = req.app.get('io');
    await logCardActivity('card_created', card._id, userId, {
      listName: list.title,
      cardTitle: card.title,
      boardId: boardId
    }, io);
    
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
    if (!existing) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    const list = await List.findById(existing.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    const board = await Board.findById(list.boardId);
    if (!board) return res.status(404).json({ message: "Bảng không tồn tại" });
    
    // Check board permission
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) return res.status(403).json({ message: "Không phải thành viên của Bảng công việc" });
    
    // Check card access permission
    const isBoardOwner = String(board.owner) === userId;
    const isBoardAdmin = board.admins && board.admins.some(a => String(a) === userId);
    
    // Check if user is assignee (người phụ trách)
    const isAssignee = existing.assignees && existing.assignees.length > 0 
      ? existing.assignees.some(a => String(a) === userId)
      : false; // If no assignees specified, NO ONE can access except admins
    
    // Only owner, board admin, or assignees can update
    // NO ACCESS for regular board members unless they are assignees
    if (!isBoardOwner && !isBoardAdmin && !isAssignee) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa thẻ này. Chỉ admin hoặc người được chỉ định phụ trách mới có thể chỉnh sửa thẻ này." });
    }
    
    const update = {};
    const activities = [];
    
    // Track changes for activity logging
    if (req.body.title !== undefined && req.body.title !== existing.title) {
      update.title = req.body.title;
      activities.push({
        type: 'card_updated',
        data: { field: 'title', oldValue: existing.title, newValue: req.body.title }
      });
    }
    
    if (req.body.description !== undefined && req.body.description !== existing.description) {
      update.description = req.body.description;
      activities.push({
        type: 'card_description_updated',
        data: { field: 'description', oldValue: existing.description, newValue: req.body.description }
      });
    }
    
    if (req.body.dueDate !== undefined && req.body.dueDate !== existing.dueDate) {
      update.dueDate = req.body.dueDate;
      activities.push({
        type: 'card_due_date_set',
        data: { field: 'dueDate', oldValue: existing.dueDate, newValue: req.body.dueDate }
      });
    }
    
    if (req.body.labels !== undefined && JSON.stringify(req.body.labels) !== JSON.stringify(existing.labels)) {
      update.labels = req.body.labels;
      activities.push({
        type: 'card_label_added',
        data: { 
          field: 'labels', 
          oldValue: existing.labels.join(', '), 
          newValue: req.body.labels.join(', '),
          labels: req.body.labels
        }
      });
    }
    
    if (req.body.assignees !== undefined && JSON.stringify(req.body.assignees) !== JSON.stringify(existing.assignees)) {
      update.assignees = req.body.assignees;
      
      // Convert user IDs to usernames for activity log
      const oldUsernames = existing.assignees && existing.assignees.length > 0 
        ? await Promise.all(existing.assignees.map(async (userId) => {
            const user = await User.findById(userId);
            return user ? user.username : userId;
          }))
        : [];
      
      const newUsernames = req.body.assignees && req.body.assignees.length > 0
        ? await Promise.all(req.body.assignees.map(async (userId) => {
            const user = await User.findById(userId);
            return user ? user.username : userId;
          }))
        : [];
      
      activities.push({
        type: 'card_assigned',
        data: { 
          field: 'assignees', 
          oldValue: oldUsernames.join(', '), 
          newValue: newUsernames.join(', '),
          assignees: req.body.assignees
        }
      });
    }
    
    const card = await Card.findByIdAndUpdate(cardId, { $set: update }, { new: true });
    if (!card) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    
    // Log activities
    const io = req.app.get('io');
    for (const activity of activities) {
      await logCardActivity(activity.type, cardId, userId, { ...activity.data, boardId: list.boardId }, io);
    }
    
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
    if (!existing) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    const list = await List.findById(existing.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    const board = await Board.findById(list.boardId);
    if (!board) return res.status(404).json({ message: "Bảng không tồn tại" });
    
    // Check board permission
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) return res.status(403).json({ message: "Không phải thành viên của Bảng công việc" });
    
    // Check card access permission - Only admins can delete
    const isAdmin = await isUserAdminOfCard(userId, existing);
    if (!isAdmin) {
      return res.status(403).json({ message: "Chỉ admin của thẻ mới có thể xóa thẻ này" });
    }
    
    // Archive card thay vì xóa
    const archivedCard = await Card.findByIdAndUpdate(
      cardId,
      { 
        $set: { 
          archived: true, 
          archivedAt: new Date() 
        } 
      },
      { new: true }
    );
    
      if (!archivedCard) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    
    // Log activity
    const io = req.app.get('io');
    await logCardActivity('card_archived', cardId, userId, {
      cardTitle: existing.title,
      boardId: list.boardId
    }, io);
    
    return res.json({ message: "Thẻ đã được lưu trữ thành công" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const restoreCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const existing = await Card.findById(cardId);
    if (!existing) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    const list = await List.findById(existing.listId);
    if (!list) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) return res.status(403).json({ message: "Không có quyền truy cập" });
    
    // Restore card
    const restoredCard = await Card.findByIdAndUpdate(
      cardId,
      { 
        $set: { 
          archived: false, 
          archivedAt: null 
        } 
      },
      { new: true }
    );
    
    if (!restoredCard) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    return res.json({ message: "Thẻ đã được khôi phục thành công" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getArchivedCards = async (req, res) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Bảng không tồn tại" });
    
    // Check if user is board member
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) {
      return res.status(403).json({ message: "Không phải thành viên của board" });
    }
    
    // All board members can see all archived cards
    // Permission restrictions apply only to edit/delete operations
    const lists = await List.find({ boardId });
    const listIds = lists.map(list => list._id);
    
    // Lấy tất cả card archived trong các list này
    const archivedCards = await Card.find({ 
      listId: { $in: listIds }, 
      archived: true 
    }).sort({ archivedAt: -1 });
    
    return res.json(archivedCards);
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
        return res.status(400).json({ message: "Thiếu Danh sách đích hoặc vị trí đích" });
    }
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: "Không tìm thấy thẻ" });
    
    // Ensure permission on both source and target lists via board membership
    const sourceList = await List.findById(card.listId);
    const targetList = await List.findById(targetListId);
    if (!sourceList || !targetList) return res.status(404).json({ message: "Danh sách không hợp lệ" });
    const sourceBoard = await Board.findById(sourceList.boardId);
    const targetBoard = await Board.findById(targetList.boardId);
    if (!sourceBoard || !targetBoard || String(sourceBoard._id) !== String(targetBoard._id)) {
      return res.status(403).json({ message: "Không có quyền hoặc khác Bảng công việc" });
    }
    
    const board = sourceBoard;
    
    // Check board permission
    const isBoardMember = String(board.owner) === userId || board.members.some(m => String(m) === userId);
    if (!isBoardMember) return res.status(403).json({ message: "Không phải thành viên của Bảng công việc" });
    
    // Check card access permission - Only assignees can move
    const isBoardOwner = String(board.owner) === userId;
    const isBoardAdmin = board.admins && board.admins.some(a => String(a) === userId);
    const isAssignee = card.assignees && card.assignees.length > 0 
      ? card.assignees.some(a => String(a) === userId)
      : false; // If no assignees specified, NO ONE can move except admins
    
    // Only owner, board admin, or assignees can move
    // NO ACCESS for regular board members unless they are assignees
    if (!isBoardOwner && !isBoardAdmin && !isAssignee) {
      return res.status(403).json({ message: "Bạn không có quyền di chuyển thẻ này. Chỉ admin hoặc người được chỉ định phụ trách mới có thể di chuyển thẻ này." });
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

    // Log activity di chuyển card
    const io = req.app.get('io');
    await logCardActivity('card_moved', cardId, userId, {
      fromList: sourceList.title,
      toList: targetList.title,
      boardId: sourceList.boardId
    }, io);

    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Thêm member vào card
export const addCardMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ message: "Thiếu mã thành viên" });
    }

    // Kiểm tra card tồn tại
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Thẻ không tồn tại" });
    }

    // Kiểm tra user có quyền với board không
    const list = await List.findById(card.listId);
    if (!list) {
      return res.status(404).json({ message: "Danh sách không tồn tại" });
    }

    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) {
      return res.status(403).json({ message: "Không có quyền với Bảng công việc này" });
    }

    // Kiểm tra member đã là thành viên của board chưa
    const isBoardMember = String(board.owner) === memberId || board.members.some(m => String(m) === memberId);
    if (!isBoardMember) {
      return res.status(400).json({ message: "Người dùng này chưa phải thành viên của Bảng công việc" });
    }

    // Nếu card chưa có members, tạo mảng rỗng
    if (!card.members) {
      card.members = [];
    }

    // Kiểm tra xem member đã được thêm vào chưa
    if (!card.members.includes(memberId)) {
      card.members.push(memberId);
    }

    // Mặc định, người tạo card sẽ là admin
    if (!card.admins || card.admins.length === 0) {
      card.admins = [card.createdBy];
    }

    await card.save();

    // Log activity
    const io = req.app.get('io');
    await logCardActivity('card_member_added', cardId, userId, {
      memberId,
      cardTitle: card.title,
      boardId: list.boardId
    }, io);

    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Xóa member khỏi card
export const removeCardMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ message: "Thiếu mã thành viên" });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Thẻ không tồn tại" });
    }

    // Kiểm tra quyền: Chỉ admin (bao gồm board owner) mới được xóa member
    const isAdmin = await isUserAdminOfCard(userId, card);
    if (!isAdmin) {
      return res.status(403).json({ message: "Chỉ admin của thẻ mới được xóa thành viên" });
    }

    // Không cho phép xóa chính mình
    if (String(memberId) === userId) {
      return res.status(400).json({ message: "Bạn không thể xóa chính mình khỏi thẻ này" });
    }

    // Xóa member khỏi members array
    card.members = (card.members || []).filter(m => String(m) !== memberId);
    
    // Xóa member khỏi admins nếu họ là admin
    card.admins = (card.admins || []).filter(a => String(a) !== memberId);

    await card.save();

    // Log activity
    const io = req.app.get('io');
    await logCardActivity('card_member_removed', cardId, userId, {
      memberId,
      cardTitle: card.title
    }, io);

    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Thêm admin vào card
export const addCardAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Thiếu mã admin" });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Thẻ không tồn tại" });
    }

    // Kiểm tra quyền: Chỉ admin (bao gồm board owner) mới được thêm admin
    const isAdmin = await isUserAdminOfCard(userId, card);
    if (!isAdmin) {
      return res.status(403).json({ message: "Chỉ admin của thẻ mới được thêm admin" });
    }

    // Kiểm tra member có trong members không
    const isMember = card.members && card.members.some(id => String(id) === adminId);
    if (!isMember) {
      // Tự động thêm vào members nếu chưa có
      if (!card.members) card.members = [];
      if (!card.members.includes(adminId)) {
        card.members.push(adminId);
      }
    }

    // Thêm vào admins
    if (!card.admins) card.admins = [];
    if (!card.admins.includes(adminId)) {
      card.admins.push(adminId);
    }

    await card.save();

    // Log activity
    const io = req.app.get('io');
    await logCardActivity('card_admin_added', cardId, userId, {
      adminId,
      cardTitle: card.title
    }, io);

    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Xóa admin khỏi card
export const removeCardAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Thiếu mã admin" });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card không tồn tại" });
    }

    // Kiểm tra quyền: Chỉ admin mới được xóa admin
    const isAdmin = await isUserAdminOfCard(userId, card);
    if (!isAdmin) {
      return res.status(403).json({ message: "Chỉ admin mới được xóa admin khác" });
    }

    // Không cho phép xóa chính mình
    if (String(adminId) === userId) {
      return res.status(400).json({ message: "Bạn không thể xóa chính mình" });
    }

    // Xóa khỏi admins
    card.admins = (card.admins || []).filter(a => String(a) !== adminId);

    await card.save();

    // Log activity
    const io = req.app.get('io');
    await logCardActivity('card_admin_removed', cardId, userId, {
      adminId,
      cardTitle: card.title
    }, io);

    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Kiểm tra quyền user với card
export const checkCardPermission = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card không tồn tại" });
    }

    const list = await List.findById(card.listId);
    if (!list) {
      return res.status(404).json({ message: "List không tồn tại" });
    }

    const board = await Board.findOne({ _id: list.boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) {
      return res.json({ hasAccess: false, isAdmin: false, isMember: false });
    }

    // Kiểm tra xem user có phải admin của card không (bao gồm board owner)
    const isAdmin = await isUserAdminOfCard(userId, card);
    
    // Kiểm tra xem user có phải member của card không
    const isMember = card.members && card.members.some(id => String(id) === userId);
    
    // Board owner và card members cũng có access
    const isBoardOwner = String(board.owner) === userId;
    const hasAccess = isAdmin || isMember || isBoardOwner;

    return res.json({
      hasAccess: hasAccess,
      isAdmin: isAdmin,
      isMember: isMember,
      isBoardOwner: isBoardOwner,
      card: card
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


