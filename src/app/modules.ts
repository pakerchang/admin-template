import articlesModule from "@/modules/articles";
import authModule from "@/modules/auth";
import bannersModule from "@/modules/banners";
import consumersModule from "@/modules/consumers";
import ordersModule from "@/modules/orders";
import productModule from "@/modules/product";
import suppliersModule from "@/modules/suppliers";
import tagsModule from "@/modules/tags";
import teamMembersModule from "@/modules/team-members";
import usersModule from "@/modules/users";

import type { TApp } from "@/app/kernel/create-app";

/** 唯一安裝 module 的清單（D4：刪 domain = 刪這裡的一行 + 目錄；AC-1 以本檔 use 呼叫數驗收，註解勿寫該字面） */
export const installModules = (app: TApp) =>
  app
    // generic
    .use(authModule)
    .use(usersModule)
    .use(teamMembersModule)
    // domain
    .use(ordersModule)
    .use(productModule)
    .use(suppliersModule)
    .use(consumersModule)
    .use(bannersModule)
    .use(articlesModule)
    .use(tagsModule);
