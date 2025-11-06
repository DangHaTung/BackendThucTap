import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { 
  getChecklistsByCard, 
  createChecklist, 
  updateChecklist, 
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem
} from "../controllers/checklist.controller.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// Checklist routes
router.get("/cards/:cardId/checklists", getChecklistsByCard);
router.post("/cards/:cardId/checklists", createChecklist);
router.put("/checklists/:checklistId", updateChecklist);
router.delete("/checklists/:checklistId", deleteChecklist);

// Checklist item routes
router.post("/checklists/:checklistId/items", createChecklistItem);
router.put("/checklist-items/:itemId", updateChecklistItem);
router.delete("/checklist-items/:itemId", deleteChecklistItem);

export default router;

