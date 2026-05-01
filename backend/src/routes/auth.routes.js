import { Router } from "express";
import { z } from "zod";
import {
  changePassword,
  getCurrentUser,
  listUsers,
  loginUser,
  logoutUser,
  registerUser
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../utils/validators.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().toLowerCase(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

router.post("/signup", validate(registerSchema), registerUser);
router.post("/signin", validate(loginSchema), loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.patch("/password", verifyJWT, validate(changePasswordSchema), changePassword);
router.get("/me", verifyJWT, getCurrentUser);
router.get("/users", verifyJWT, listUsers);

export default router;
