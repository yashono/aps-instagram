import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function resolvePublicBaseUrl(): string {
  const explicit = process.env.PUBLIC_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    return `https://${railwayDomain.replace(/^https?:\/\//, "")}`;
  }

  const port = Number(process.env.PORT || 3000);
  return `http://localhost:${port}`;
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
  publicBaseUrl: resolvePublicBaseUrl(),
  // Instagram professional account ID from Meta dashboard (or "me")
  instagramUserId:
    process.env.INSTAGRAM_USER_ID?.trim() || "17841477504090912",
};
