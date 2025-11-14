import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SiderBarHeader } from "./sidebar-header";
import { useSelector } from "react-redux";
import { hasRole } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { SearchForm } from "./search-form";
import { useLanguage } from "@/contexts/LanguageProvider";
import { getAdminLinks } from "../links/adminLinks";
import { getDriverLinks } from "../links/driverLinks";
import { getMerchantLinks } from "../links/merchantLinks";
import RequestPickupButton from "@/components/RequestPickupButton";
import FloatingImportProgressDialog from "../../Shipments/Dialogs/FloatingImportProgressDialog";
import ScrollToTopButton from "@/components/ScrollToTopButton";

export function AppSidebar({ onTabOpen, ...props }) {
  const user = useSelector((store) => store.auth.user);
  const isMerchant = hasRole("Merchant");
  const [search, setSearch] = React.useState("");
  const { t } = useTranslation();
  const { language } = useLanguage();

  const getLinks = () => {
    if (hasRole("Driver")) {
      return getDriverLinks(t);
    } else if (hasRole("Merchant") || hasRole("Merchant Admin")) {
      return getMerchantLinks(t);
    } else {
      return getAdminLinks(t);
    }
  };

  const data = {
    workspaces:
      user.workspaces?.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        type: workspace.type,
        readable_type: workspace.type.split("\\").pop(),
      })) || [],
    navMain: getLinks(),
  };

  const filterByPermissions = (items) => {
    return items
      .map((item) => {
        const hasPermission =
          typeof item.permission === "function"
            ? item.permission()
            : item.permission !== false;

        if (!hasPermission) return null;

        let filteredSubItems = [];
        if (item.items?.length) {
          filteredSubItems = filterByPermissions(item.items);
          if (filteredSubItems.length === 0) return null;
        }

        return {
          ...item,
          items: filteredSubItems,
        };
      })
      .filter(Boolean);
  };

  const filterItems = (items, query) => {
    return items
      .map((item) => {
        let matchesSearch = item.label
          ?.toLowerCase()
          .includes(query.toLowerCase());
        let filteredSubItems = [];

        if (item.items?.length) {
          filteredSubItems = filterItems(item.items, query);
          if (filteredSubItems.length > 0) matchesSearch = true;
        }

        return matchesSearch ? { ...item, items: filteredSubItems } : null;
      })
      .filter(Boolean);
  };

  const filteredNavItems = React.useMemo(() => {
    const permissionFiltered = filterByPermissions(data.navMain);
    const query = search.trim().toLowerCase();

    if (!query) return permissionFiltered;

    return permissionFiltered
      .map((group) => {
        const filteredItems = filterItems(group.items || [], query);
        return filteredItems.length > 0
          ? { ...group, items: filteredItems }
          : null;
      })
      .filter(Boolean);
  }, [search, data.navMain]);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      side={language === "ar" ? "right" : "left"}
    >
      <SidebarHeader>
        <SiderBarHeader workspaces={data.workspaces} user={user} />
        {isMerchant && (
          <RequestPickupButton
            className={`fixed bottom-6 ${language === "ar" ? "left-6" : "right-6"
              } z-50 shadow-lg`}
          />
        )}
        <FloatingImportProgressDialog
          className={`fixed bottom-6 ${language === "ar" ? "left-6" : "right-6"
            } z-50 shadow-lg`}
        />
        <ScrollToTopButton />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SearchForm
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SidebarGroup>
        <NavMain
          onTabOpen={onTabOpen}
          items={filteredNavItems}
          searchQuery={search}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}