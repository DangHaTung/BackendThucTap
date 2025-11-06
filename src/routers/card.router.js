import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCardSchema, moveCardSchema, updateCardSchema } from "../validations/app.validation.js";
import { createCard, deleteCard, getCardsByList, moveCard, updateCard, restoreCard, getArchivedCards, addCardMember, removeCardMember, addCardAdmin, removeCardAdmin, checkCardPermission } from "../controllers/card.controller.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get("/lists/:listId/cards", getCardsByList);
router.post("/boards/:boardId/lists/:listId/cards", validate(createCardSchema), createCard);
router.put("/cards/:cardId", validate(updateCardSchema), updateCard);
router.delete("/cards/:cardId", deleteCard);
router.post("/cards/:cardId/move", validate(moveCardSchema), moveCard);
router.post("/cards/:cardId/restore", restoreCard);
router.get("/boards/:boardId/cards/archived", getArchivedCards);

// Card member and admin management
router.post("/cards/:cardId/members", addCardMember);
router.delete("/cards/:cardId/members", removeCardMember);
router.post("/cards/:cardId/admins", addCardAdmin);
router.delete("/cards/:cardId/admins", removeCardAdmin);
router.get("/cards/:cardId/permission", checkCardPermission);

export default router;


