import rateLimit from "express-rate-limit";

const message = (windowMinutes: number) => ({
  message: `Too many requests, please try again in ${windowMinutes} minutes`,
});

// Applied globally to every route — coarse protection against abuse
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15),
});

// Wallet endpoints — deposit/withdraw are sensitive operations
export const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15),
});

// Bet placement — prevent rapid-fire bet spam
export const betsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15),
});

// Admin endpoints — sync/settle operations are expensive
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15),
});
