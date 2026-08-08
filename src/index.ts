import express from "express";
import path from "path";
import { CATALOG_FILENAME } from "./catalog";
import { config } from "./config";
import { initDb } from "./db";
import { warmCatalogAttachment } from "./meta/catalogAttachment";
import { webhookRouter } from "./webhook";

initDb();

const app = express();
const publicDir = path.join(process.cwd(), "public");

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);

app.use(
  "/files",
  express.static(publicDir, {
    maxAge: "7d",
    setHeaders(res, filePath) {
      if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${CATALOG_FILENAME}"`
        );
      }
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
      catalog: `/files/${CATALOG_FILENAME}`,
    },
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "aaryash-instagram-ai-agent" });
});

app.use("/webhook", webhookRouter);

app.listen(config.port, () => {
  console.log(`Aaryash Instagram AI agent listening on port ${config.port}`);
  console.log(`Catalog URL: ${config.publicBaseUrl}/files/${CATALOG_FILENAME}`);
  console.log(`Instagram user id: ${config.instagramUserId}`);
  void warmCatalogAttachment();
});
