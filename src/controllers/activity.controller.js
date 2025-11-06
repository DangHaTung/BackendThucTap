import Activity from '../models/activity.model.js';
import Card from '../models/card.model.js';
import User from '../models/user.model.js';

/**
 * Tạo mô tả chi tiết cho hoạt động
 */
const createActivityDescription = (type, data) => {
  switch (type) {
    case 'card_created':
      return `đã tạo thẻ "${data.cardTitle}" trong danh sách "${data.listName}"`;
    
    case 'card_updated':
      if (data.field === 'title') {
        return `đã đổi tên thẻ từ "${data.oldValue}" thành "${data.newValue}"`;
      }
      return `đã cập nhật ${data.field} của thẻ`;
    
    case 'card_description_updated':
      return `đã cập nhật mô tả của thẻ`;
    
    case 'card_due_date_set':
      const oldDate = data.oldValue ? new Date(data.oldValue).toLocaleDateString('vi-VN') : 'không có';
      const newDate = data.newValue ? new Date(data.newValue).toLocaleDateString('vi-VN') : 'không có';
      return `đã thay đổi hạn chót từ ${oldDate} thành ${newDate}`;
    
    case 'card_label_added':
      return `đã cập nhật nhãn từ "${data.oldValue}" thành "${data.newValue}"`;
    
    case 'card_assigned':
      return `đã cập nhật thành viên từ "${data.oldValue}" thành "${data.newValue}"`;
    
    case 'comment_added':
      return `đã thêm bình luận: "${data.commentText}"`;
    
    case 'card_moved':
      return `đã di chuyển thẻ từ "${data.fromList}" sang "${data.toList}"`;
    
    case 'card_archived':
      return `đã lưu trữ thẻ "${data.cardTitle}"`;
    
    case 'card_restored':
      return `đã khôi phục thẻ "${data.cardTitle}" từ lưu trữ`;
    
    case 'card_completed':
      return `đã đánh dấu thẻ hoàn thành`;
    
    default:
      return `đã thực hiện ${type}`;
  }
};

/**
 * Ghi log hoạt động liên quan đến card
 * @param {string} type - Loại hoạt động (card_created, card_updated, etc)
 * @param {string} cardId - ID của card
 * @param {string} userId - ID của user thực hiện hành động
 * @param {Object} data - Dữ liệu bổ sung về hoạt động
 */
export const logCardActivity = async (type, cardId, userId, data = {}, io = null) => {
  try {
    
    let boardId = data.boardId;
    if (!boardId) {
      const card = await Card.findById(cardId).populate('listId');
      if (card && card.listId) {
        boardId = card.listId.boardId;
      }
    }
    const user = await User.findById(userId);
    const userName = user ? user.username : 'Unknown User';
    const userAvatar = user ? user.avatar : '';
    
    // Tạo mô tả chi tiết cho hoạt động
    const description = createActivityDescription(type, data);
    
    const activityData = {
      type,
      cardId,
      userId,
      boardId: boardId,
      userName: userName,
      userAvatar: userAvatar,
      data: {
        ...data,
        description: description
      },
      createdAt: new Date()
    };
    
    
    const savedActivity = await Activity.create(activityData);
    
    // Emit Socket.IO event để frontend tự động refresh
    if (io) {
      io.to(`card_${cardId}`).emit('activity_added', savedActivity);
    }
  } catch (err) {
  }
};

/**
 * Lấy lịch sử hoạt động của một card
 * @param {string} cardId - ID của card
 */
export const getCardActivities = async (req, res) => {
  try {
    const { cardId } = req.params;
    const activities = await Activity.find({ cardId })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    return res.json(activities);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy lịch sử hoạt động của một board
 * @param {string} boardId - ID của board
 */
export const getActivitiesByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const activities = await Activity.find({ boardId })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    return res.json(activities);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
