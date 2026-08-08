import { Router, type Request, type Response } from "express";
import { generateReply } from "./ai/reply";
import { config } from "./config";
import {
  getRecentMessages,
  isNewUser,
  saveMessage,
} from "./db";
import { sendInstagramMessage } from "./meta/sendMessage";
import { verifyMetaSignature } from "./meta/verifySignature";
import { WELCOME_MESSAGE } from "./templates/welcome";

type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
  };
};

type WebhookBody = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: MessagingEvent[];
  }>;
};

const processedMessageIds = new Set<string>();
const MAX_PROCESSED_IDS = 2000;

function rememberMessageId(mid: string | undefined): boolean {
  if (!mid) {
    return false;
  }
  if (processedMessageIds.has(mid)) {
    return true;
  }
  processedMessageIds.add(mid);
  if (processedMessageIds.size > MAX_PROCESSED_IDS) {
    const oldest = processedMessageIds.values().next().value;
    if (oldest) {
      processedMessageIds.delete(oldest);
    }
  }
  return false;
}

async function handleIncomingMessage(
  senderId: string,
  text: string
): Promise<void> {
  const firstContact = isNewUser(senderId);

  if (firstContact) {
    await sendInstagramMessage(senderId, WELCOME_MESSAGE);
    saveMessage(senderId, "assistant", WELCOME_MESSAGE);
  }

  const history = getRecentMessages(senderId, 20);
  const reply = await generateReply(history, text);

  saveMessage(senderId, "user", text);
  await sendInstagramMessage(senderId, reply);
  saveMessage(senderId, "assistant", reply);
}

export const webhookRouter = Router();

webhookRouter.get("/", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Browser visit with no Meta verify params
  if (!mode && !token && !challenge) {
    res.status(200).json({
      ok: true,
      endpoint: "/webhook",
      message:
        "Webhook is ready. Meta will call this URL with hub.mode, hub.verify_token, and hub.challenge.",
    });
    return;
  }

  if (mode === "subscribe" && token === config.verifyToken) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
});

webhookRouter.post("/", (req: Request, res: Response) => {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const signature = req.get("x-hub-signature-256") || undefined;

  if (!rawBody || !verifyMetaSignature(rawBody, signature)) {
    console.warn("Invalid webhook signature");
    res.sendStatus(403);
    return;
  }

  // Acknowledge quickly; process async
  res.sendStatus(200);

  const body = req.body as WebhookBody;
  if (body.object !== "instagram" && body.object !== "page") {
    return;
  }

  const events =
    body.entry?.flatMap((entry) => entry.messaging || []) || [];

  void (async () => {
    for (const event of events) {
      try {
        const senderId = event.sender?.id;
        const text = event.message?.text?.trim();
        const mid = event.message?.mid;

        if (!senderId || !text || event.message?.is_echo) {
          continue;
        }

        if (rememberMessageId(mid)) {
          continue;
        }

        await handleIncomingMessage(senderId, text);
      } catch (error) {
        console.error("Failed to handle messaging event:", error);
      }
    }
  })();
});
