import { setupWorker } from "msw/browser";

import type { HttpHandler } from "msw";

export const startBrowserWorker = (handlers: HttpHandler[]) =>
  setupWorker(...handlers).start({ onUnhandledFrame: "bypass" });
