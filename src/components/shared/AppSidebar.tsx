import { SignOutButton } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Globe, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { sidebarMenu } from "@/constants/sidebar";

export const AppSidebar = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleNavigate = (path: string) => {
    navigate({ to: `/${path}` });
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
            {sidebarMenu.map((item) => {
              return (
                <SidebarMenuItem key={item.label}>
                  {item.sub ? (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-2">
                              {item.icon}
                              <span className="text-white">
                                {t(item.label).toString()}
                              </span>
                            </div>
                            <ChevronDown className="size-4 shrink-0 text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {item.sub.map((subItem) => (
                          <SidebarMenuButton
                            key={subItem.label}
                            onClick={() => handleNavigate(subItem.path)}
                            className="w-full pl-8"
                          >
                            <span className="text-white">-</span>
                            <span className="text-white">
                              {t(subItem.label).toString()}
                            </span>
                          </SidebarMenuButton>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      onClick={() => handleNavigate(item.path)}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="text-white">
                          {t(item.label).toString()}
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
                <SignOutButton>
                  <Button variant="destructive">{t("logout.confirm")}</Button>
                </SignOutButton>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
};
