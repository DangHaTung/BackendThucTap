import express from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createBoardSchema, inviteByEmailSchema, inviteMemberSchema, leaveBoardSchema, removeMemberSchema, updateBoardSchema } from "../validations/app.validation.js";
import {
  getMyBoards,
  getOwnedBoards,
  getJoinedBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
  inviteMemberByEmail,
  removeMember,
  leaveBoard,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  promoteToAdmin,
  removeAdmin,
} from "../controllers/board.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/boards", getMyBoards);
router.get("/boards/owned", getOwnedBoards);
router.get("/boards/joined", getJoinedBoards);
router.post("/boards", validate(createBoardSchema), createBoard);
router.get("/boards/:id", getBoardById);
router.put("/boards/:id", validate(updateBoardSchema), updateBoard);
router.delete("/boards/:id", deleteBoard);
router.post("/boards/:id/invite", validate(inviteMemberSchema), inviteMember);
router.post("/boards/:id/invite-by-email", validate(inviteByEmailSchema), inviteMemberByEmail);
router.post("/boards/:id/remove-member", validate(removeMemberSchema), removeMember);
router.post("/boards/:id/leave", validate(leaveBoardSchema), leaveBoard);
router.post("/boards/:id/promote-admin", promoteToAdmin);
router.post("/boards/:id/remove-admin", removeAdmin);

// Invitation routes
router.get("/invitations", getMyInvitations);
router.post("/invitations/:invitationId/accept", acceptInvitation);
router.post("/invitations/:invitationId/reject", rejectInvitation);

export default router;


