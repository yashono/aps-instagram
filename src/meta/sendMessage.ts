import fs from "fs";
import path from "path";
import { config } from "../config";

const GRAPH_API_VERSION = "v21.0";

type SendResult = {
  message_id?: string;
  recipient_id?: string;
  attachment_id?: string;
};

type ApiErrorPayload = SendResult & {
  error?: { message?: string; code?: number; type?: string; error_subcode?: number };
};

function graphHost(token: string): string {
  return token.startsWith("IG")
    ? "https://graph.instagram.com"
    : "https://graph.facebook.com";
}

function graphActorPath(): string {
  return `${graphHost(config.pageAccessToken)}/${GRAPH_API_VERSION}/${config.instagramUserId}`;
}

function getMessagesUrl(): string {
  return `${graphActorPath()}/messages`;
}

function getAttachmentsUrl(): string {
  return `${graphActorPath()}/message_attachments`;
}

async function readJson(response: Response): Promise<ApiErrorPayload> {
  return (await response.json()) as ApiErrorPayload;
}

async function postMessage(
  body: Record<string, unknown>
): Promise<SendResult> {
  const response = await fetch(getMessagesUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.pageAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await readJson(response);
  if (!response.ok) {
    const detail = payload.error?.message || JSON.stringify(payload);
    throw new Error(`Instagram send failed (${response.status}): ${detail}`);
  }

  return payload;
}

export async function sendInstagramMessage(
  recipientId: string,
  text: string
): Promise<SendResult> {
  return postMessage({
    recipient: { id: recipientId },
    message: { text },
  });
}

export async function sendInstagramFileByAttachmentId(
  recipientId: string,
  attachmentId: string
): Promise<SendResult> {
  return postMessage({
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: "file",
        payload: {
          attachment_id: attachmentId,
        },
      },
    },
  });
}

export async function uploadReusablePdf(
  localFilePath: string,
  filename: string
): Promise<string> {
  const absolutePath = path.resolve(localFilePath);
  const bytes = fs.readFileSync(absolutePath);
  const file = new File([bytes], filename, { type: "application/pdf" });

  const form = new FormData();
  form.append(
    "message",
    JSON.stringify({
      attachment: {
        type: "file",
        payload: {
          is_reusable: true,
        },
      },
    })
  );
  form.append("filedata", file);

  const response = await fetch(getAttachmentsUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.pageAccessToken}`,
    },
    body: form,
  });

  const payload = await readJson(response);
  if (!response.ok || !payload.attachment_id) {
    const detail = payload.error?.message || JSON.stringify(payload);
    throw new Error(
      `Instagram attachment upload failed (${response.status}): ${detail}`
    );
  }

  return payload.attachment_id;
}
