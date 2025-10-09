import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCardSchema, moveCardSchema, updateCardSchema } from "../validations/app.validation.js";
import { createCard, deleteCard, getCardsByList, moveCard, updateCard } from "../controllers/card.controller.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get("/lists/:listId/cards", getCardsByList);
router.post("/boards/:boardId/lists/:listId/cards", validate(createCardSchema), createCard);
router.put("/cards/:cardId", validate(updateCardSchema), updateCard);
router.delete("/cards/:cardId", deleteCard);
router.post("/cards/:cardId/move", validate(moveCardSchema), moveCard);

export default router;


