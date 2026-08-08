import express from "express";
import { config } from "./config";
import { initDb } from "./db";
import { webhookRouter } from "./webhook";

initDb();

const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "aaryash-instagram-ai-agent",
    message: "Aaryash Instagram AI agent is running",
    endpoints: {
      health: "/health",
      webhook: "/webhook",
    },
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "aaryash-instagram-ai-agent" });
});

app.use("/webhook", webhookRouter);

app.listen(config.port, () => {
  console.log(`Aaryash Instagram AI agent listening on port ${config.port}`);
});
