import test from "node:test";
import assert from "node:assert/strict";

import { resolveChatCompletionsEndpoint } from "../src/services/aiEndpoint.js";

test("adds the chat completions path to the DeepSeek base URL", () => {
  assert.equal(
    resolveChatCompletionsEndpoint("https://api.deepseek.com"),
    "https://api.deepseek.com/chat/completions",
  );
});

test("adds the chat completions path to a v1 base URL", () => {
  assert.equal(
    resolveChatCompletionsEndpoint("https://api.deepseek.com/v1/"),
    "https://api.deepseek.com/v1/chat/completions",
  );
});

test("keeps a complete endpoint unchanged", () => {
  assert.equal(
    resolveChatCompletionsEndpoint("https://api.deepseek.com/chat/completions"),
    "https://api.deepseek.com/chat/completions",
  );
});

test("keeps a custom proxy endpoint unchanged", () => {
  assert.equal(
    resolveChatCompletionsEndpoint("https://example.com/api/deepseek/chat"),
    "https://example.com/api/deepseek/chat",
  );
});
