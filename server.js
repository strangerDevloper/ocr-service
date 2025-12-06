import express from "express";
import { createWorker } from "tesseract.js";
import sharp from "sharp";

const app = express();
app.use(express.json({ limit: "50mb" }));

const worker = await createWorker({ logger: (m) => console.log(m) });
await worker.load();
await worker.loadLanguage("eng");
await worker.initialize("eng");

app.post("/solve", async (req, res) => {
  try {
    const { captcha } = req.body;

    if (!captcha) return res.status(400).json({ error: "captcha missing" });

    // Decode base64
    let imgBuffer = Buffer.from(captcha, "base64");

    try {
      // Ensure PNG/JPEG is valid
      await sharp(imgBuffer).metadata();
    } catch (e) {
      // Convert to JPEG if corrupted
      imgBuffer = await sharp(imgBuffer).jpeg().toBuffer();
    }

    const { data } = await worker.recognize(imgBuffer);

    res.json({ solution: data.text.trim() });
  } catch (err) {
    console.error("OCR fatal:", err);
    res.status(500).json({ error: "OCR failed", details: err.message });
  }
});

app.listen(3000, () => console.log("OCR running on port 3000"));
