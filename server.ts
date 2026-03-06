import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));

  // 1. 数据库初始化
  if (process.env.DATABASE_URL) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS images (
          id SERIAL PRIMARY KEY,
          image_data TEXT NOT NULL,
          prompt_original TEXT NOT NULL,
          prompt_en TEXT NOT NULL,
          prompt_zh TEXT NOT NULL,
          tags TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Database initialized");
    } catch (err) {
      console.error("❌ DB Error:", err);
    }
  }

  // 2. 静态文件路径逻辑
  const distPath = path.resolve(__dirname, "dist");
  const isProd = process.env.NODE_ENV === "production";
  const hasDist = fs.existsSync(distPath);

  console.log(`Mode: ${process.env.NODE_ENV}, DistExists: ${hasDist}`);

  if (isProd && hasDist) {
    // 生产模式：直接提供打包后的文件
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({error: "API not found"});
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // 开发模式：使用 Vite 中间件
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({error: "API not found"});
      const template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
