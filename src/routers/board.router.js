import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createBoardSchema, inviteByEmailSchema, inviteMemberSchema, leaveBoardSchema, removeMemberSchema, updateBoardSchema } from "../validations/app.validation.js";
import {
  getMyBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
  inviteMemberByEmail,
  removeMember,
  leaveBoard,
} from "../controllers/board.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/boards", getMyBoards);
router.post("/boards", validate(createBoardSchema), createBoard);
router.get("/boards/:id", getBoardById);
router.put("/boards/:id", validate(updateBoardSchema), updateBoard);
router.delete("/boards/:id", deleteBoard);
router.post("/boards/:id/invite", validate(inviteMemberSchema), inviteMember);
router.post("/boards/:id/invite-by-email", validate(inviteByEmailSchema), inviteMemberByEmail);
router.post("/boards/:id/remove-member", validate(removeMemberSchema), removeMember);
router.post("/boards/:id/leave", validate(leaveBoardSchema), leaveBoard);

export default router;


