// server/index.js

require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const Tesseract = require("tesseract.js");
const fs = require("fs");
const { OpenAI } = require("openai");

const app = express();
const PORT = 5003;

// 0️⃣ Confirm .env loaded
console.log("🔐 OpenAI Key Loaded:", process.env.OPENAI_API_KEY ? "✅ YES" : "❌ NO (check .env)");

// 1️⃣ Health-check route
app.get("/", (req, res) => {
  console.log("👋 GET / hit");
  res.send("✅ Server is up");
});

// 2️⃣ Middleware
app.use(cors());
const upload = multer({ dest: "uploads/" });

// 3️⃣ OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 4️⃣ Prompt template
const promptTemplate = (text) => `
Extract and return the following fields from this receipt:
- Vendor Name
- Date (in format YYYY-MM-DD)
- Total Amount (number only)

If any field is missing, use "Not Found". Only return a JSON like:
{ "vendor": "...", "date": "...", "amount": "..." }

Receipt:
"""
${text}
"""
`;

// 5️⃣ OCR + LLM endpoint
app.post("/api/ocr", upload.single("receipt"), async (req, res) => {
  console.log("📥 POST /api/ocr hit");

  const imagePath = req.file?.path;
  if (!imagePath) {
    console.error("❌ No file received");
    return res.status(400).json({ error: "No file received." });
  }
  console.log("🖼️ File saved to:", imagePath);

  try {
    // OCR
    console.log("📸 Running OCR...");
    const { data: { text } } = await Tesseract.recognize(imagePath, "eng");
    console.log("🧾 OCR Text Snippet:", text.slice(0, 200).replace(/\n/g, " ") + "...");

    // LLM
    console.log("📤 Sending OCR text to ChatGPT...");
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: promptTemplate(text) }],
      temperature: 0
    });
    const raw = chatResponse.choices[0].message.content;
    console.log("🧠 ChatGPT Raw Output:\n", raw);

    // Parse JSON
    let extracted;
    try {
      extracted = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON Parse Error:", err);
      return res.status(500).json({ error: "Failed to parse LLM response." });
    }
    console.log("✅ Extracted Data:", extracted);

    // Send back to client
    res.json(extracted);

  } catch (err) {
    console.error("❌ Handler Error:", err);
    res.status(500).json({ error: "OCR or LLM step failed. See server logs." });
  } finally {
    // Cleanup file
    try {
      fs.unlinkSync(imagePath);
      console.log("🧹 Cleaned up uploaded file");
    } catch (_) {}
  }
});

// 6️⃣ Start server & keep alive
app.listen(PORT, () => {
  console.log(`🚀 Listening on http://localhost:${PORT}`);
});
setInterval(() => {}, 1_000_000);   // keeps Node’s event loop active
console.log("⏳ Server should now stay alive; CTRL+C to stop.");
