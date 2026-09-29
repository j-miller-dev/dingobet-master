import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  REDIS_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),

  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.string().optional(),

  ODDS_API_KEY: z.string().min(1),
  ODDS_API_BASE_URL: z.string().url().default("https://api.the-odds-api.com/v4"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
