import Label from "../models/label.model.js";
import Board from "../models/board.model.js";
import Card from "../models/card.model.js";

export const getLabels = async (req, res) => {
  try {
    const { boardId } = req.params;
    const labels = await Label.find({ boardId }).sort({ name: 1 });
    return res.json(labels);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createLabel = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: "Thiếu tên label" });
    const label = await Label.create({ boardId, name, color: color || "#999999" });
    return res.status(201).json(label);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateLabel = async (req, res) => {
  try {
    const { labelId } = req.params;
    const label = await Label.findByIdAndUpdate(
      labelId,
      { $set: { name: req.body.name, color: req.body.color } },
      { new: true }
    );
    if (!label) return res.status(404).json({ message: "Không tìm thấy label" });
    return res.json(label);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteLabel = async (req, res) => {
  try {
    const { labelId } = req.params;
    const removed = await Label.findByIdAndDelete(labelId);
    if (!removed) return res.status(404).json({ message: "Không tìm thấy label" });
    // Optionally detach from cards
    await Card.updateMany({ labels: removed.name }, { $pull: { labels: removed.name } });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const attachLabelToCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { labelName } = req.body;
    if (!labelName) return res.status(400).json({ message: "Thiếu labelName" });
    const card = await Card.findByIdAndUpdate(cardId, { $addToSet: { labels: labelName } }, { new: true });
    if (!card) return res.status(404).json({ message: "Không tìm thấy card" });
    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const detachLabelFromCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { labelName } = req.body;
    const card = await Card.findByIdAndUpdate(cardId, { $pull: { labels: labelName } }, { new: true });
    if (!card) return res.status(404).json({ message: "Không tìm thấy card" });
    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


