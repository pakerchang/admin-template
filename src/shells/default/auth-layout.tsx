import { Outlet } from "@tanstack/react-router";

/** 登入頁外框；表單本身是 auth module 的頁面（routeId `auth.login`，可覆寫） */
export const AuthLayout = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0e0c1f] to-[#1a1a22]">
    <Outlet />
  </div>
);
