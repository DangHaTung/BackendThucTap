import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createListSchema, updateListSchema } from "../validations/app.validation.js";
import { createList, deleteList, getListsByBoard, updateList } from "../controllers/list.controller.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get("/boards/:boardId/lists", getListsByBoard);
router.post("/boards/:boardId/lists", validate(createListSchema), createList);
router.put("/boards/:boardId/lists/:listId", validate(updateListSchema), updateList);
router.delete("/boards/:boardId/lists/:listId", deleteList);

export default router;


