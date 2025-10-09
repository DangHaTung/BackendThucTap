import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { searchBoardsSchema, searchCardsSchema } from "../validations/app.validation.js";
import { searchBoards, searchCards } from "../controllers/search.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/search/boards", validate(searchBoardsSchema), searchBoards);
router.get("/search/cards", validate(searchCardsSchema), searchCards);

export default router;


