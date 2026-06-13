import { describe, it, expect } from "vitest";
import { ApiError } from "@google/genai";
import {
  ANALYZE_MODEL,
  CHAT_MODEL,
  FLASH_LITE_MODEL,
  FLASH_MODEL,
  fallbackModel,
  isRateLimited,
} from "../gemini";

describe("fallbackModel", () => {
  it("maps flash to flash-lite and back", () => {
    expect(fallbackModel(FLASH_MODEL)).toBe(FLASH_LITE_MODEL);
    expect(fallbackModel(FLASH_LITE_MODEL)).toBe(FLASH_MODEL);
  });

  it("returns null for unknown models", () => {
    expect(fallbackModel("gemini-unknown")).toBeNull();
  });

  it("matches configured primary models", () => {
    expect(fallbackModel(CHAT_MODEL)).toBe(FLASH_LITE_MODEL);
    expect(fallbackModel(ANALYZE_MODEL)).toBe(FLASH_MODEL);
  });
});

describe("isRateLimited", () => {
  it("detects ApiError with status 429", () => {
    const err = new ApiError({ status: 429, message: "rate limited" });
    expect(isRateLimited(err)).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isRateLimited(new ApiError({ status: 500, message: "fail" }))).toBe(false);
    expect(isRateLimited(new Error("fail"))).toBe(false);
    expect(isRateLimited(null)).toBe(false);
  });
});
