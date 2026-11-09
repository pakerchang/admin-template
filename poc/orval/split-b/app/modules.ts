// kernel 的 module 註冊表：只經各 module index.ts
import { bannersModule } from "../modules/banners";
import { usersModule } from "../modules/users";
import { authModule } from "../modules/auth";
export const modules = [bannersModule, usersModule, authModule];
