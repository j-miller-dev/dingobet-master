import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { loginSchema, registerSchema } from "../schemas/auth.schemas.js";
import {
  login,
  register,
  refresh,
  changePasswordHandler,
  resetPasswordHandler,
  logout,
} from "../controllers/auth.controller.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later" },
});

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/refresh", refresh);
router.patch("/change-password", authenticate, changePasswordHandler);
router.patch("/reset-password", authenticate, resetPasswordHandler);
router.post("/logout", logout);

export default router;
