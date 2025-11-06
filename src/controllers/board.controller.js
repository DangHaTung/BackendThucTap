import Board from "../models/board.model.js";
import User from "../models/user.model.js";
import BoardInvitation from "../models/boardInvitation.model.js";

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

// Lấy boards mà user là owner
export const getOwnedBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    const boards = await Board.find({ owner: userId })
      .populate('owner', 'username email avatar')
      .populate('members', 'username email avatar')
      .sort({ updatedAt: -1 });
    return res.json(boards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Lấy boards mà user là member (không phải owner)
export const getJoinedBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    const boards = await Board.find({ 
      members: userId, 
      owner: { $ne: userId } 
    })
      .populate('owner', 'username email avatar')
      .populate('members', 'username email avatar')
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
    const board = await Board.findOne({ _id: req.params.id, $or: [{ owner: userId }, { members: userId }] })
      .populate('owner', 'username email avatar')
      .populate('members', 'username email avatar');
    if (!board) return res.status(404).json({ message: "Không tìm thấy Bảng công việc" });
    return res.json(board);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateBoard = async (req, res) => {
  try {
    const userId = req.user.id;
    const boardId = req.params.id;
    
    // Kiểm tra board có tồn tại và user có quyền truy cập không
    const board = await Board.findOne({ 
      _id: boardId, 
      $or: [{ owner: userId }, { members: userId }] 
    });
    
    if (!board) {
      return res.status(404).json({ message: "Không tìm thấy Bảng công việc hoặc không có quyền truy cập" });
    }
    
    // Cập nhật tiêu đề board
    const updatedBoard = await Board.findOneAndUpdate(
      { _id: boardId },
      { $set: { title: req.body.title } },
      { new: true }
    ).populate('owner', 'username email avatar')
     .populate('members', 'username email avatar');
    
    return res.json(updatedBoard);
  } catch (err) {
    console.error('Error in updateBoard:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const deleteBoard = async (req, res) => {
  try {
    const userId = req.user.id;
    const boardId = req.params.id;
    
    // Chỉ owner mới có thể xóa board
    const removed = await Board.findOneAndDelete({ _id: boardId, owner: userId });
    if (!removed) return res.status(404).json({ message: "Không tìm thấy Bảng công việc hoặc không có quyền xóa" });
    return res.status(204).end();
  } catch (err) {
    console.error('Error in deleteBoard:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ message: "Thiếu mã thành viên" });
    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, owner: userId },
      { $addToSet: { members: memberId } },
      { new: true }
    );
    if (!board) return res.status(404).json({ message: "Không tìm thấy Bảng công việc hoặc không có quyền truy cập" });
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
    
    // Kiểm tra board có tồn tại và user có quyền truy cập không
    const board = await Board.findOne({ 
      _id: boardId, 
      $or: [{ owner: userId }, { members: userId }] 
    });
    
    if (!board) {
      return res.status(404).json({ message: "Không tìm thấy Bảng công việc hoặc không có quyền truy cập" });
    }
    
    // Kiểm tra email có tồn tại không
    const target = await User.findOne({ email });
    if (!target) {
      return res.status(404).json({ message: "Email không tồn tại trong hệ thống. Vui lòng đăng ký tài khoản trước" });
    }
    
    // Kiểm tra user đã là member chưa
    if (board.members.includes(target._id)) {
      return res.status(400).json({ message: "Người này đã là thành viên của Bảng công việc" });
    }
    
    // Kiểm tra đã có lời mời pending chưa
    const existingInvitation = await BoardInvitation.findOne({
      boardId: boardId,
      inviteeEmail: email,
      status: "pending"
    });
    
    if (existingInvitation) {
      return res.status(400).json({ message: "Đã có lời mời đang chờ phản hồi cho email này. Vui lòng chờ hoặc từ chối lời mời trước" });
    }
    
    // Tạo lời mời mới
    const invitation = await BoardInvitation.create({
      boardId: boardId,
      inviterId: userId,
      inviteeEmail: email,
      inviteeId: target._id,
      status: "pending",
      message: `Bạn được mời tham gia Bảng công việc "${board.title}"`
    });
    
    return res.json({
      message: `Đã gửi lời mời đến ${email}. Họ cần chấp nhận để tham gia Bảng công việc.`,
      invitation: invitation
    });
  } catch (err) {
    console.error('Error in inviteMemberByEmail:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.body;
    const boardId = req.params.id;
    
    // Kiểm tra quyền: chỉ owner hoặc member của board mới có thể xóa member
    const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] });
    if (!board) {
      return res.status(404).json({ message: "Không tìm thấy Bảng công việc hoặc không có quyền truy cập" });
    }
    
    // Không cho phép xóa chính mình
    if (String(memberId) === String(userId)) {
      return res.status(400).json({ message: "Bạn không thể xóa chính mình khỏi Bảng công việc" });
    }
    
    // Không cho phép member xóa owner
    if (String(board.owner) === String(memberId) && String(board.owner) !== String(userId)) {
      return res.status(400).json({ message: "Chỉ owner mới có thể xóa owner khỏi Bảng công việc" });
    }
    
    const updatedBoard = await Board.findOneAndUpdate(
      { _id: boardId },
      { $pull: { members: memberId } },
      { new: true }
    );
    
    return res.json(updatedBoard);
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
    if (!board) return res.status(404).json({ message: "Không tìm thấy Bảng công việc" });
    if (String(board.owner) === String(userId)) {
      return res.status(400).json({ message: "Owner không thể rời Bảng công việc. Hãy chuyển quyền hoặc xóa Bảng công việc." });
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

// Lấy danh sách lời mời của user hiện tại
export const getMyInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    const invitations = await BoardInvitation.find({
      inviteeEmail: user.email,
      status: "pending"
    }).populate('boardId', 'title owner')
      .populate('inviterId', 'username email avatar');
    
    return res.json(invitations);
  } catch (err) {
    console.error('Error in getMyInvitations:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Chấp nhận lời mời
export const acceptInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const invitationId = req.params.invitationId;
    
    const invitation = await BoardInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Không tìm thấy lời mời" });
    }
    
    // Kiểm tra user có phải người được mời không
    const user = await User.findById(userId);
    if (invitation.inviteeEmail !== user.email) {
      return res.status(403).json({ message: "Bạn không có quyền chấp nhận lời mời này" });
    }
    
    if (invitation.status !== "pending") {
      return res.status(400).json({ message: "Lời mời đã được xử lý" });
    }
    
    // Thêm user vào board
    const updatedBoard = await Board.findOneAndUpdate(
      { _id: invitation.boardId },
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('owner', 'username email avatar')
     .populate('members', 'username email avatar');
    
    // Cập nhật trạng thái invitation
    invitation.status = "accepted";
    invitation.inviteeId = userId;
    await invitation.save();
    
    return res.json({
      message: "Đã chấp nhận lời mời thành công",
      board: updatedBoard
    });
  } catch (err) {
    console.error('Error in acceptInvitation:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Từ chối lời mời
export const rejectInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const invitationId = req.params.invitationId;
    
    const invitation = await BoardInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Không tìm thấy lời mời" });
    }
    
    // Kiểm tra user có phải người được mời không
    const user = await User.findById(userId);
    if (invitation.inviteeEmail !== user.email) {
      return res.status(403).json({ message: "Bạn không có quyền từ chối lời mời này" });
    }
    
    if (invitation.status !== "pending") {
      return res.status(400).json({ message: "Lời mời đã được xử lý" });
    }
    
    // Cập nhật trạng thái invitation
    invitation.status = "rejected";
    invitation.inviteeId = userId;
    await invitation.save();
    
    return res.json({
      message: "Đã từ chối lời mời"
    });
  } catch (err) {
    console.error('Error in rejectInvitation:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Thêm admin cho board (chỉ owner mới có thể)
export const promoteToAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.body;
    const boardId = req.params.id;
    
    if (!memberId) {
      return res.status(400).json({ message: "Thiếu mã thành viên" });
    }
    
    // Chỉ owner mới có thể promote admin
    const board = await Board.findOne({ _id: boardId, owner: userId });
    if (!board) {
      return res.status(403).json({ message: "Chỉ owner mới có thể thêm admin cho Bảng công việc" });
    }
    
    // Kiểm tra member có trong board không
    const isMember = board.members.some(m => String(m) === String(memberId));
    if (!isMember) {
      return res.status(400).json({ message: "Người này chưa phải là thành viên của Bảng công việc" });
    }
    
    // Không cho phép owner tự promote mình
    if (String(memberId) === String(userId)) {
      return res.status(400).json({ message: "Owner không cần promote làm admin cho Bảng công việc" });
    }
    
    // Kiểm tra đã là admin chưa
    const isAlreadyAdmin = board.admins && board.admins.some(a => String(a) === String(memberId));
    if (isAlreadyAdmin) {
      return res.status(400).json({ message: "Người này đã là admin cho Bảng công việc" });
    }
    
    // Thêm vào admins
    const updatedBoard = await Board.findOneAndUpdate(
      { _id: boardId },
      { $addToSet: { admins: memberId } },
      { new: true }
    ).populate('owner', 'username email avatar')
     .populate('members', 'username email avatar')
     .populate('admins', 'username email avatar');
    
    return res.json(updatedBoard);
  } catch (err) {
    console.error('Error in promoteToAdmin:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Xóa admin khỏi board (chỉ owner mới có thể)
export const removeAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { adminId } = req.body;
    const boardId = req.params.id;
    
    if (!adminId) {
      return res.status(400).json({ message: "Thiếu adminId" });
    }
    
    // Get board
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: "Bảng không tồn tại" });
    }
    
    // Chỉ owner mới có thể remove admin (admin cao nhất)
    const isBoardOwner = String(board.owner) === userId;
    if (!isBoardOwner) {
      return res.status(403).json({ message: "Chỉ chủ sở hữu Bảng công việc (admin cao nhất) mới có thể xóa quyền admin" });
    }
    
    // Không cho phép xóa chính mình khỏi admins
    if (String(adminId) === String(userId)) {
      return res.status(400).json({ message: "Bạn không thể xóa chính mình khỏi admins" });
    }
    
    // Kiểm tra admin này có tồn tại trong admins không
    const isInAdmins = board.admins && board.admins.some(a => String(a) === adminId);
    if (!isInAdmins) {
      return res.status(400).json({ message: "Người này không phải admin" });
    }
    
    // Xóa khỏi admins
    const updatedBoard = await Board.findOneAndUpdate(
      { _id: boardId },
      { $pull: { admins: adminId } },
      { new: true }
    ).populate('owner', 'username email avatar')
     .populate('members', 'username email avatar')
     .populate('admins', 'username email avatar');
    
    return res.json(updatedBoard);
  } catch (err) {
    console.error('Error in removeAdmin:', err);
    return res.status(500).json({ message: err.message });
  }
};