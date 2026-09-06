const CHAT_COMPLETIONS_PATH = "/chat/completions";

export const resolveChatCompletionsEndpoint = (endpoint) => {
  const url = new URL(endpoint.trim());
  const pathname = url.pathname.replace(/\/+$/, "");

  if (!pathname || pathname === "/") {
    url.pathname = CHAT_COMPLETIONS_PATH;
  } else if (pathname.endsWith("/v1")) {
    url.pathname = `${pathname}${CHAT_COMPLETIONS_PATH}`;
  }

  return url.toString();
};
