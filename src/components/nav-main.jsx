"use merchant";

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageProvider";
import RequiredField from "./misc/RequiredField";
import { useTranslation } from "react-i18next";

export function NavMain({ items, searchQuery }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const { language } = useLanguage();
  const { toggleSidebar } = useSidebar();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const expanded = {};

    // Handle search query separately
    if (searchQuery.trim() !== "") {
      items.forEach((group) => {
        expanded[group.label] = true;
        group.items?.forEach((subItem) => {
          expanded[subItem.label] = true;
        });
      });
    }

    // Handle active page
    const currentPath = location.pathname;
    let foundActive = false;
    items.some((group) => {
      if (foundActive) return false;

      if (group.path === currentPath) {
        expanded[group.label] = true;
        foundActive = true;
        return true;
      }

      if (group.items) {
        const subItemFound = group.items.some((subItem) => {
          if (foundActive) return false;
          if (subItem.path === currentPath && !subItem?.isQuickLink) {
            expanded[group.label] = true;
            expanded[subItem.label] = true;
            foundActive = true;
            return true;
          }

          if (subItem.items) {
            return subItem.items.some((nestedItem) => {
              if (foundActive) return false;
              if (nestedItem.path === currentPath) {
                expanded[group.label] = true;
                expanded[subItem.label] = true;
                foundActive = true;
                return true;
              }
              return false;
            });
          }
          return false;
        });

        if (subItemFound) return true;
      }
      return false;
    });

    setOpenGroups(expanded);
  }, [searchQuery, items, location.pathname]);

  const toggleGroup = (label) => {
    setOpenGroups((prev) => {
      const isCurrentlyOpen = !!prev[label];
      const isTopLevel = items.some((item) => item.label === label);
      const item = items.find((i) => i.label === label) ||
        items.find((i) => i.items?.some((sub) => sub.label === label));
      if (item?.alwaysOpen) {
        return {
          ...prev,
          [label]: true
        };
      }
      if (isTopLevel) {
        // Only allow one top-level group open at a time
        const newState = {};
        if (!isCurrentlyOpen) {
          newState[label] = true;
        }
        return newState;
      }
      // Nested groups can toggle independently
      return {
        ...prev,
        [label]: !isCurrentlyOpen,
      };
    });
  };

  const renderChevron = (isOpen, alwaysOpen) =>
    !alwaysOpen && (language === "ar" ? (
      <ChevronLeft
        className={`ml-auto transition-transform duration-200 ${isOpen ? "-rotate-90" : ""
          }`}
      />
    ) : (
      <ChevronRight
        className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-90" : ""
          }`}
      />
    ));

  const renderPlusButton = (plusLink) => (
    <Link
      to={plusLink}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="flex items-center justify-center hover:text-primary"
    >
      <Button variant="sidebarAdd" className="ml-auto">
        <Plus size={16} />
      </Button>
    </Link>
  );

  const renderItemContent = (item) => {
    return (
      <div
        className={`flex w-full items-center ${open ? "overflow-hidden" : ""
          }  ${item.isPlus && item.plusLink ? "justify-between" : "justify-start"
          }`}
      >
        <div
          className={`flex group items-center gap-2  ${open ? "overflow-hidden" : ""
            } flex-1`}
        >
          {item.icon && (
            <item.icon
              className={`size-[20px] text-[#031d4e] dark:text-[#7492DF] group-hover/icon:text-[#031d4e] transition-colors duration-200 ${location?.pathname === item?.path ? "!text-[#031d4e]" : ""
                }`}
            />
          )}
          <span className="truncate" title={item.label}>
            {item.notAllowed && <RequiredField />}
            {item.label}
          </span>
        </div>
        {item.isPlus && item.plusLink && renderPlusButton(item.plusLink)}
      </div>
    );
  };

  const renderLink = (item) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={(e) => {
          e.stopPropagation();
          // Close sidebar on mobile when clicking plus button
          if (isMobile) {
            toggleSidebar();
            console.log("link clicked");
          }
        }}
        className={`flex group/icon items-center px-4 py-3 rounded-md transition-colors w-full ${isActive
          ? "bg-gray-200 dark:bg-gray-600 text-[#031d4e]"
          : "text-gray-700 hover:bg-gray-100"
          }`}
      >
        {renderItemContent(item)}
      </Link>
    );
  };

  const { open } = useSidebar();
  const { t } = useTranslation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("Menu")}</SidebarGroupLabel>
      <SidebarMenu>
        {items?.map((item) => (
          <SidebarMenuItem key={item.label}>
            {item.items && item.items?.length > 0 ? (
              <Collapsible asChild open={!!openGroups[item.label] || item.alwaysOpen}>
                <div>
                  <SidebarMenuButton
                    tooltip={item.label}
                    onClick={() => toggleGroup(item.label)}
                    className=" group/icon"
                  >
                    {renderItemContent(item)}
                    {renderChevron(!!openGroups[item.label], item.alwaysOpen)}
                  </SidebarMenuButton>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) =>
                        subItem.permission ? (
                          <SidebarMenuSubItem key={subItem.label}>
                            {subItem.items?.length > 0 ? (
                              <Collapsible
                                asChild
                                open={!!openGroups[subItem.label] || subItem.alwaysOpen}
                              >
                                <div>
                                  <SidebarMenuSubButton
                                    tooltip={subItem.label}
                                    onClick={() => toggleGroup(subItem.label)}
                                    className=" group/icon"
                                  >
                                    {renderItemContent(subItem)}
                                    {renderChevron(!!openGroups[subItem.label], subItem.alwaysOpen)}
                                  </SidebarMenuSubButton>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {subItem.items.map((nestedItem) => (
                                        <SidebarMenuSubItem
                                          key={nestedItem.label}
                                        >
                                          <SidebarMenuSubButton asChild>
                                            {renderLink(nestedItem)}
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            ) : (
                              <SidebarMenuSubButton asChild>
                                {renderLink(subItem)}
                              </SidebarMenuSubButton>
                            )}
                          </SidebarMenuSubItem>
                        ) : null
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ) : (
              <SidebarMenuButton tooltip={item.label}>
                {item.icon && <item.icon />}
                <span>{item.label}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
