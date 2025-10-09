import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { attachLabelSchema, labelCrudSchema, updateLabelSchema } from "../validations/app.validation.js";
import { attachLabelToCard, createLabel, deleteLabel, detachLabelFromCard, getLabels, updateLabel } from "../controllers/label.controller.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get("/boards/:boardId/labels", getLabels);
router.post("/boards/:boardId/labels", validate(labelCrudSchema), createLabel);
router.put("/labels/:labelId", validate(updateLabelSchema), updateLabel);
router.delete("/labels/:labelId", deleteLabel);
router.post("/cards/:cardId/labels", validate(attachLabelSchema), attachLabelToCard);
router.delete("/cards/:cardId/labels", detachLabelFromCard);

export default router;


