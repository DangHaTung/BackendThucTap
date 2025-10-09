import Board from "../models/board.model.js";
import Card from "../models/card.model.js";

export const searchBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;
    const cond = { $or: [{ owner: userId }, { members: userId }] };
    if (q) cond.title = { $regex: q, $options: "i" };
    const boards = await Board.find(cond).sort({ updatedAt: -1 });
    return res.json(boards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const searchCards = async (req, res) => {
  try {
    const { q, label } = req.query;
    const cond = {};
    if (q) cond.title = { $regex: q, $options: "i" };
    if (label) cond.labels = label;
    const cards = await Card.find(cond).sort({ updatedAt: -1 });
    return res.json(cards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


