import { config } from "../config";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0/me/messages";

type SendResult = {
  message_id?: string;
  recipient_id?: string;
};

export async function sendInstagramMessage(
  recipientId: string,
  text: string
): Promise<SendResult> {
  const response = await fetch(
    `${GRAPH_API_URL}?access_token=${encodeURIComponent(config.pageAccessToken)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    }
  );

  const payload = (await response.json()) as SendResult & {
    error?: { message?: string; code?: number; type?: string };
  };

  if (!response.ok) {
    const detail = payload.error?.message || JSON.stringify(payload);
    throw new Error(`Instagram send failed (${response.status}): ${detail}`);
  }

  return payload;
}
