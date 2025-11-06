import express from "express";

import { authenticate } from "../middleware/auth.js";
import { getCardActivities, getActivitiesByBoard, logCardActivity } from "../controllers/activity.controller.js";

const router = express.Router();

// Middleware xác thực cho tất cả routes
router.use(authenticate);

// Lấy danh sách activities của một card
router.get("/cards/:cardId/activities", getCardActivities);

// Lấy danh sách activities của một board
router.get("/boards/:boardId/activities", getActivitiesByBoard);

// Route POST không cần thiết vì logCardActivity được gọi từ các controller khác
// router.post("/boards/:boardId/activities", logCardActivity);

export default router;

