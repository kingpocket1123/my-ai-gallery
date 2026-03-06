import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // 自动创建数据库表
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
    console.log("✅ 数据库连接成功，表已就绪");
  } catch (err) {
    console.error("❌ 数据库连接失败:", err);
  }

  app.use(express.json({ limit: '50mb' }));

  app.get("/api/images", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM images ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "获取失败" }); }
  });

  app.post("/api/images", async (req, res) => {
    const { image_data, prompt } = req.body;
    try {
      await pool.query(
        "INSERT INTO images (image_data, prompt_original, prompt_en, prompt_zh) VALUES ($1, $2, $3, $4)",
        [image_data, prompt, prompt, prompt]
      );
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "保存失败" }); }
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 服务器运行在端口: ${PORT}`);
  });
}

startServer();
