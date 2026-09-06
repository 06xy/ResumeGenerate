export const normalizeEditableText = (value) => String(value ?? "").replace(/\r\n?/g, "\n").trim();
