"use merchant";

import React, { useEffect, useState } from "react";
import { Building2Icon, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageProvider";

export function SiderBarHeader({ workspaces, user }) {
  const { isMobile } = useSidebar();
  const authContext = useAuthContext();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const workspace = useSelector((store) => store.auth.user.current_workspace);

  const handleWorkspaceChange = (workspace) => {
    authContext.setWorkSpace(workspace);
    window.location.reload();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              dir={language === "ar" ? "ltr" : "rtl"}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2Icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  <span className="text-[#031d4e] dark:text-[#7492DF]">
                    {t("title.Ra7al")}
                  </span>{" "}
                  <span className="text-[#031d4e]">{t("title.Express")}</span>
                </span>
                <span className="truncate text-xs">{workspace?.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("Workspces")}
            </DropdownMenuLabel>
            {workspaces &&
              workspaces?.map(
                (workspace, index) =>
                  console.log(workspace) || (
                    <DropdownMenuItem
                      key={`${workspace.type}-${workspace.id}`}
                      onClick={() => handleWorkspaceChange(workspace)}
                      className="gap-2 p-2"
                    >
                      {workspace.name}
                    </DropdownMenuItem>
                  )
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
