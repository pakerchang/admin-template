import "@/locales/i18n";
import "@/styles/global.css";

import { createCore } from "@/app/core";
import { createApp } from "@/app/kernel/create-app";
import { operations } from "@/app/mock";
import { installModules } from "@/app/modules";
import { apiBaseUrl } from "@/services/api-client";
import { defaultShell } from "@/shells/default";

installModules(
  createApp({ shell: defaultShell, operations, apiBaseUrl, core: createCore() })
).mount("#root");
