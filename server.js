import express from "express";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
const app = express();
app.use(express.json({ limit: "50mb" }));

let count = 1;
const worker = await createWorker({ logger: (m) => console.log(m) });
await worker.load();
await worker.loadLanguage("eng");
await worker.initialize("eng");

app.post("/solve", async (req, res) => {
  try {
    console.log("Prcess Start");
    let { captcha } = req.body;

    if (!captcha) return res.status(400).json({ error: "captcha missing" });

    // Remove data URI prefix
    captcha = captcha.replace(/^data:image\/\w+;base64,/, "");

    let imgBuffer = Buffer.from(captcha, "base64");

    // Validate or Rescue Convert
    try {
      await sharp(imgBuffer).metadata();
    } catch (err) {
      console.warn("Metadata failed, trying rescue...");

      const raw = await sharp(imgBuffer)
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });

      imgBuffer = await sharp(raw.data, {
        raw: {
          width: raw.info.width,
          height: raw.info.height,
          channels: raw.info.channels,
        },
      })
        .png()
        .toBuffer();
    }

    const { data } = await worker.recognize(imgBuffer);

    return res.json({ solution: data.text.trim() });
  } catch (err) {
    console.error("OCR fatal:", err);
    res.status(500).json({ error: "OCR failed", details: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3000, () => console.log("OCR running on port 3000"));
