import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 3000),
  verifyToken: required("VERIFY_TOKEN"),
  appSecret: required("APP_SECRET"),
  pageAccessToken: required("PAGE_ACCESS_TOKEN"),
  openaiApiKey: required("OPENAI_API_KEY"),
  databasePath: process.env.DATABASE_PATH?.trim() || "./data/bot.db",
  skipSignatureVerification:
    process.env.SKIP_SIGNATURE_VERIFICATION === "true",
  openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
};
