// server.js
import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import Tesseract from "tesseract.js";
import { OpenAI } from "openai";
import { fileURLToPath } from "url";

// ————— Setup ESM __dirname —————
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ————— Load ENV —————
dotenv.config();
const PORT = process.env.PORT || 5009;

// ————— App & Middleware —————
const app = express();
app.use(cors());
app.use(express.json());

// ————— Your existing routes here —————
// e.g. app.get("/get-expenses", (req,res)=>{ … });
// ————————————————————————————

// ————— OCR + ChatGPT Endpoint —————
const upload = multer({ dest: path.join(__dirname, "uploads/") });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/ocr", upload.single("receipt"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  const imagePath = req.file.path;

  try {
    // 1) OCR
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "eng");

    // 2) Structure with ChatGPT
    const prompt = `
Extract and return ONLY a JSON object with these fields:
- vendor (string)
- date (YYYY-MM-DD)
- amount (number only)
If missing, put "Not Found".

Receipt text:
"""
${text}
"""
`;
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });
    const raw = chat.choices[0].message.content;

    // 3) Parse & Respond
    const result = JSON.parse(raw);
    return res.json(result);
  } catch (err) {
    console.error("OCR/AI Error:", err);
    return res.status(500).json({ error: "Failed to extract data." });
  } finally {
    // cleanup upload
    fs.unlinkSync(imagePath);
  }
});
// ————————————————————————————

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
