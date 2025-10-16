import express from "express";

import { login, register, me, updateMe } from "../controllers/auth.controller.js";
import { loginSchema, registerSchema, updateMeSchema } from "../validations/auth.validation.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// Validate chỉ body cho login/register
const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: true, allowUnknown: true });
  if (error) return res.status(400).json({ message: error.details[0].message });
  return next();
};

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

// profile routes
router.get("/me", authenticate, me);
router.put("/me", authenticate, validate(updateMeSchema), updateMe);

export default router;
