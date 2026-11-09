import { builtinEnvironments } from "vitest/environments";

import type { Environment } from "vitest/environments";

// msw 3 在 node 端走 HTTP 層攔截，Node 原生 Request 只收原生 AbortSignal；
// vitest 的 jsdom 環境會把全域 AbortController / AbortSignal 換成 jsdom 版，這裡在 jsdom 建好後換回原生。
const { AbortController, AbortSignal } = globalThis;

export default {
  ...builtinEnvironments.jsdom,
  name: "jsdom-node-abort",
  async setup(global, options) {
    const env = await builtinEnvironments.jsdom.setup(global, options);
    Object.assign(global, { AbortController, AbortSignal });
    return env;
  },
} satisfies Environment;
