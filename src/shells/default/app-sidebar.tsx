import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Globe, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { clearAuth } from "@/shared/api/session";
import { useVisibleNav } from "@/shared/module";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Separator } from "@/shared/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/shared/ui/sidebar";

import type { TransKey } from "@/shared/i18n/types";

export const AppSidebar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const nav = useVisibleNav();

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    navigate({ to: "/login" });
  };

  const handleNavigate = (to: string) => {
    navigate({ to });
  };

  const languages = [
    { code: "zh", label: "中文" },
    { code: "en", label: "English" },
  ] as const;

  return (
    <Sidebar className="dark">
      <SidebarHeader
        className="flex h-16 cursor-pointer items-center justify-center"
        onClick={() => navigate({ to: "/" })}
      >
        <h2 className="text-2xl font-bold text-white">
          {t("dashboard.title")}
        </h2>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav.map((item) => {
              return (
                <SidebarMenuItem key={item.id}>
                  {item.children ? (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-2">
                              {item.icon && (
                                <item.icon className="text-white" />
                              )}
                              <span className="text-white">
                                {t(item.label as TransKey).toString()}
                              </span>
                            </div>
                            <ChevronDown className="size-4 shrink-0 text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {item.children.map((subItem) => (
                          <SidebarMenuButton
                            key={subItem.id}
                            onClick={() => handleNavigate(subItem.to)}
                            className="w-full pl-8"
                          >
                            <span className="text-white">-</span>
                            <span className="text-white">
                              {t(subItem.label as TransKey).toString()}
                            </span>
                          </SidebarMenuButton>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton onClick={() => handleNavigate(item.to)}>
                      <div className="flex items-center gap-2">
                        {item.icon && <item.icon className="text-white" />}
                        <span className="text-white">
                          {t(item.label as TransKey).toString()}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <Separator />

      <SidebarFooter className="flex flex-col gap-2 px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-white hover:bg-white/10"
            >
              <Globe className="size-4" />
              <span>
                {languages.find((lang) => lang.code === i18n.language)?.label ||
                  "語言"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={i18n.language === lang.code ? "bg-accent" : ""}
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-white hover:bg-white/10"
            >
              <LogOut className="size-4" />
              <span>{t("logout.title")}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logout.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("logout.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" onClick={handleLogout}>
                  {t("logout.confirm")}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
};
