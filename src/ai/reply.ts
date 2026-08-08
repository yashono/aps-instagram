import OpenAI from "openai";
import { config } from "../config";
import type { ChatMessage } from "../db";
import { SYSTEM_PROMPT } from "./prompts";

const client = new OpenAI({ apiKey: config.openaiApiKey });

function looksLikePricingQuestion(text: string): boolean {
  return /(price|rate|kitna|cost|rs\.?|₹|inr|charge|album|sheet|catalog|catalogue|coverpad|briefcase|combo|calendar|glossy|matte|velvet|ap0\d)/i.test(
    text
  );
}

export async function generateReply(
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const pricing = looksLikePricingQuestion(userMessage);

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
    temperature: pricing ? 0.3 : 0.7,
    max_tokens: pricing ? 450 : 260,
    messages,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    return "Thanks for messaging us! Album, photobook, coverpad, ya kisi product ka price chahiye to size/type bata dena — main catalog se bata dunga.";
  }

  return text;
}
