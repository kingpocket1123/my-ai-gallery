import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import fs from "fs"; // 正确的导入方式
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

  // 初始化数据库
  if (!process.env.DATABASE_URL) {
    console.error("错误：未检测到 DATABASE_URL 环境变量！");
  } else {
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
      console.log("✅ 数据库连接成功且表已就绪");
    } catch (err) {
      console.error("❌ 数据库初始化失败:", err);
    }
  }

  app.use(express.json({ limit: '50mb' }));

  // API 路由
  app.get("/api/images", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM images ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "获取失败" });
    }
  });

  app.post("/api/images", async (req, res) => {
    const { image_data, prompt, tags } = req.body;
    try {
      const query = `
        INSERT INTO images (image_data, prompt_original, prompt_en, prompt_zh, tags)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `;
      const result = await pool.query(query, [image_data, prompt, prompt, prompt, JSON.stringify(tags || [])]);
      res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
      res.status(500).json({ error: "保存失败" });
    }
  });

  // 静态文件处理
  const distPath = path.join(__dirname, "dist");
  const useStatic = process.env.NODE_ENV === "production" && fs.existsSync(distPath);

  if (!useStatic) {
    console.log("正在启动 Vite 开发模式...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("正在启动 生产环境 静态服务...");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 服务器运行在: http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
