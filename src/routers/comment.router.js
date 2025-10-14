import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { commentCreateSchema, commentMutateSchema } from "../validations/app.validation.js";
import { createComment, deleteComment, getComments, updateComment } from "../controllers/comment.controller.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get("/cards/:cardId/comments", getComments);
router.post("/cards/:cardId/comments", validate(commentCreateSchema), createComment);
router.put("/comments/:commentId", validate(commentMutateSchema), updateComment);
router.delete("/comments/:commentId", deleteComment);

export default router;


