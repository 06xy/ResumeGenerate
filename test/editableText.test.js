import test from "node:test";
import assert from "node:assert/strict";

import { normalizeEditableText } from "../src/utils/editableText.js";

test("keeps line breaks entered in editable resume text", () => {
  assert.equal(normalizeEditableText("第一行\n第二行"), "第一行\n第二行");
});

test("normalizes Windows line breaks and trims surrounding blank space", () => {
  assert.equal(normalizeEditableText("  第一行\r\n第二行  "), "第一行\n第二行");
});
