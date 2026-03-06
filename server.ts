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

  // ⭐ 1. 调试接口 (放在最前面，防止被拦截)
  app.get("/api/health", (req, res) => {
    const distPath = path.resolve(__dirname, "dist");
    res.json({
      status: "ok",
      env: process.env.NODE_ENV,
      distExists: fs.existsSync(distPath),
      dirname: __dirname
    });
  });

  // 2. 数据库初始化
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

  // 3. 业务 API 路由
  app.get("/api/images", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM images ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Fetch failed" });
    }
  });

  app.post("/api/images", async (req, res) => {
    const { image_data, prompt, tags } = req.body;
    try {
      const query = `INSERT INTO images (image_data, prompt_original, prompt_en, prompt_zh, tags) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
      const result = await pool.query(query, [image_data, prompt, prompt, prompt, JSON.stringify(tags || [])]);
      res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
      res.status(500).json({ error: "Save failed" });
    }
  });

  // 4. 静态文件与 Vite 处理
  const distPath = path.resolve(__dirname, "dist");
  const isProd = process.env.NODE_ENV === "production";
  const hasDist = fs.existsSync(distPath);

  if (isProd && hasDist) {
    console.log("Serving static files from dist...");
    app.use(express.static(distPath));
    // 生产环境的兜底路由
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({error: "API not found"});
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("Starting Vite middleware (Dev mode)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    // 开发环境的兜底路由
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
