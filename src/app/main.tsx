import "@/shared/i18n/i18n";
import "@/app/styles/global.css";

import { createCore } from "@/app/core";
import { createApp } from "@/app/kernel/create-app";
import { installModules } from "@/app/modules";
import { operations } from "@/app/operations.gen";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { defaultShell } from "@/shells/default";

installModules(
  createApp({ shell: defaultShell, operations, apiBaseUrl, core: createCore() })
).mount("#root");
