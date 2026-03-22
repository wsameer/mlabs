import { z } from "zod";

// Shared environment variable schemas
export const BaseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const ApiEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url().optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export const WebEnvSchema = BaseEnvSchema.extend({
  VITE_API_URL: z.string().url().default("http://localhost:3001"),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;
export type WebEnv = z.infer<typeof WebEnvSchema>;
