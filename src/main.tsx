import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/locales/i18n";
import "@/styles/global.css";

import { isMockEnabled } from "@/app/mock/enabled";
import { router } from "@/router";

const startMockWorker = async () => {
  if (!isMockEnabled(import.meta.env.VITE_API_MOCK)) return;
  const [{ setupWorker }, { mockHandlers }] = await Promise.all([
    import("msw/browser"),
    import("@/app/mock"),
  ]);
  await setupWorker(...mockHandlers).start({ onUnhandledFrame: "bypass" });
};

startMockWorker().then(() =>
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
);
