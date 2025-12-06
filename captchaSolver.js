// captchaSolver.js
import axios from "axios";
import {
  ANTI_CAPTCHA_API_KEY,
  ANTI_CAPTCHA_API_BASE,
  CAPTCHA_POLL_INTERVAL,
  CAPTCHA_MAX_TIMEOUT,
  CAPTCHA_MAX_RETRIES,
} from "./constants.js";

// ---------------- captcha solver ----------------
export async function solveCaptchaWithAntiCaptcha(base64Image) {
  const API_KEY = ANTI_CAPTCHA_API_KEY;
  const startTime = Date.now();

  try {
    // 1️⃣ Create a new task
    const createTaskRes = await axios.post(
      `${ANTI_CAPTCHA_API_BASE}/createTask`,
      {
        clientKey: API_KEY,
        task: {
          type: "ImageToTextTask",
          body: base64Image,
          phrase: false,
          case: false,
          numeric: 0,
          math: false,
          minLength: 0,
          maxLength: 0,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000, // 60 second timeout for createTask
      }
    );

    if (createTaskRes.data.errorId !== 0) {
      throw new Error(
        `AntiCaptcha createTask error: ${createTaskRes.data.errorDescription}`
      );
    }

    const taskId = createTaskRes.data.taskId;
    console.log("🟢 AntiCaptcha Task Created:", taskId);

    // 2️⃣ Poll for result with timeout and retry limits
    let attempt = 0;
    while (attempt < CAPTCHA_MAX_RETRIES) {
      // Check timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > CAPTCHA_MAX_TIMEOUT) {
        throw new Error(
          `AntiCaptcha timeout: Exceeded ${CAPTCHA_MAX_TIMEOUT}ms timeout`
        );
      }

      // Wait before polling (except first attempt)
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, CAPTCHA_POLL_INTERVAL));
      }

      attempt++;
      const resultRes = await axios.post(
        `${ANTI_CAPTCHA_API_BASE}/getTaskResult`,
        {
          clientKey: API_KEY,
          taskId,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 60000, // 60 second timeout for getTaskResult
        }
      );

      if (resultRes.data.errorId !== 0) {
        throw new Error(
          `AntiCaptcha getTaskResult error: ${resultRes.data.errorDescription}`
        );
      }

      // Check if still processing
      if (resultRes.data.status === "processing") {
        console.log(
          `⏳ AntiCaptcha: still solving... (attempt ${attempt}/${CAPTCHA_MAX_RETRIES})`
        );
        continue;
      }

      // Check if ready
      if (resultRes.data.status === "ready" && resultRes.data.solution?.text) {
        const captchaText = resultRes.data.solution.text;
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ AntiCaptcha Solved in ${elapsedTime}s: ${captchaText}`);
        return captchaText.trim();
      }

      // Unexpected status
      throw new Error(
        `AntiCaptcha unexpected status: ${resultRes.data.status}`
      );
    }

    // Max retries exceeded
    throw new Error(
      `AntiCaptcha timeout: Exceeded ${CAPTCHA_MAX_RETRIES} polling attempts`
    );
  } catch (err) {
    if (err.response) {
      console.error(
        `❌ AntiCaptcha API ERROR: ${err.response.status} - ${err.message}`
      );
    } else if (err.code === "ECONNABORTED") {
      console.error(`❌ AntiCaptcha TIMEOUT: ${err.message}`);
    } else {
      console.error(`❌ AntiCaptcha ERROR: ${err.message}`);
    }
    return null;
  }
}
