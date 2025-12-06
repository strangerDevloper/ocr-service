import dotenv from "dotenv";

dotenv.config();

export const ANTI_CAPTCHA_API_KEY = process.env.ANTI_CAPTCHA_API_KEY;
export const ANTI_CAPTCHA_API_BASE = process.env.ANTI_CAPTCHA_API_BASE;

// Captcha solver configuration
export const CAPTCHA_POLL_INTERVAL =
  parseInt(process.env.CAPTCHA_POLL_INTERVAL) || 3000; // 3 seconds default
export const CAPTCHA_MAX_TIMEOUT =
  parseInt(process.env.CAPTCHA_MAX_TIMEOUT) || 120000; // 2 minutes default
export const CAPTCHA_MAX_RETRIES =
  parseInt(process.env.CAPTCHA_MAX_RETRIES) || 40; // ~2 minutes with 3s interval
