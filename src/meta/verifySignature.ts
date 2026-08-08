import crypto from "crypto";
import { config } from "../config";

export function verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined
): boolean {
  if (config.skipSignatureVerification) {
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", config.appSecret)
    .update(rawBody)
    .digest("hex");

  const provided = signatureHeader.slice("sha256=".length);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(provided, "utf8")
    );
  } catch {
    return false;
  }
}
