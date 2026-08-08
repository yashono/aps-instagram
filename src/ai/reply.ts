import OpenAI from "openai";
import { config } from "../config";
import type { ChatMessage } from "../db";
import { SYSTEM_PROMPT } from "./prompts";

const client = new OpenAI({ apiKey: config.openaiApiKey });

export async function generateReply(
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content,
    })),
    { role: "user", content: userMessage },
  ];

  const completion = await client.chat.completions.create({
    model: config.openaiModel,
    temperature: 0.7,
    max_tokens: 220,
    messages,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    return "Thanks for messaging us! Could you share a bit more about what you need — photo book, business cards, or another print job?";
  }

  return text;
}
