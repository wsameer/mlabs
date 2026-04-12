import { type ApiEnv, ApiEnvSchema } from "@workspace/types";
import { loadEnvFiles } from "./env-loader.js";

/**
 * Environment variable laoder and validator
 */

loadEnvFiles();

function validateEnv(): ApiEnv {
  const parsed = ApiEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error("");

    const errors = parsed.error.flatten();
    if (errors.fieldErrors) {
      for (const [field, messages] of Object.entries(errors.fieldErrors)) {
        console.error(`   ${field}:`);
        messages?.forEach((msg) => console.error(`       - ${msg}`));
      }
    }

    console.error("");
    console.error("💡 Tips:");
    console.error(" 1. Copy .env.example to .env");
    console.error(" 2. Fill in required values (especially DATABASE_URL)");
    console.error(
      " 3. DATABASE_URL should point to your sqlite file (e.g. ./data/mlabs.db)"
    );
    console.error("");

    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();
