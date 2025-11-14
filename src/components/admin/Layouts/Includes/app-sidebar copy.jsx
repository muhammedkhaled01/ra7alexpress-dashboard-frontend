import {
  CarFront,
  DoorOpen,
  GalleryVerticalEnd,
  Home,
  Minus,
  Plus,
  Settings,
  StopCircle,
  User2Icon,
  UserCheck,
} from "lucide-react";
import * as React from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { can, hasRole } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { SearchForm } from "./search-form";

export function AppSidebar({ ...props }) {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState("");
  const location = useLocation();
  const user = useSelector((store) => store.auth.user);
  const isMerchant = hasRole("Merchant")

  const items = {
    navMain: [
      {
        label: t("Main"),
        url: "#",
        items: [
          {
            label: t("Dashboard"),
            path: "/dashboard",
            icon: Home,
            permission: can("Dashboard access"),
          },
          {
            label: t("Shippers"),
            path: "/shippers",
            icon: CarFront,
            permission: can("Shipper access"),
          },
          {
            label: t("Consignee"),
            path: "/consignees",
            icon: Home,
            permission: can("Consignee access"),
          },
          {
            label: t("Units"),
            path: "/units",
            icon: Home,
            permission: can("Unit access"),
          },
          {
            label: t("Governorates"),
            path: "/governorates",
            icon: CarFront,
            permission: can("Governorate access"),
          },
          {
            label: t("State"),
            path: "/states",
            icon: CarFront,
            permission: can("State access"),
          },
          {
            label: t("Places"),
            path: "/places",
            icon: CarFront,
            permission: can("Governorate access"),
          },
          {
            label: t("Cities"),
            path: "/cities",
            icon: CarFront,
            permission: can("City access"),
          },
          {
            label: t("Hubs"),
            path: "/hubs",
            icon: CarFront,
            permission: can("Hub access"),
          },
          {
            label: t("Stations"),
            path: "/stations",
            icon: CarFront,
            permission: can("Station access"),
          },
          {
            label: t("Branches"),
            path: "/branches",
            icon: CarFront,
            permission: can("Branch access"),
          },
          {
            label: t("Roles"),
            path: "/roles",
            icon: UserCheck,
            permission: can("Role access"),
          },
          {
            label: t("Permissions"),
            path: "/permissions",
            icon: DoorOpen,
            permission: can("Permission access"),
          },
          {
            label: t("Dashboard Configurations"),
            path: "/status-transition-config",
            icon: Settings,
            permission: can("Setting access"),
          },
          // {
          //   label: t("Profile"),
          //   path: "/profile",
          //   icon: User2Icon,
          //   permission: can("Profile access"),
          // },
        ],
      },
      {
        label: t("Merchant Management"),
        url: "#",
        items: [
          {
            label: t("Merchants"),
            path: "/merchants",
            icon: UserCheck,
            permission: can("Merchant access"),
          },
          {
            label: t("Merchant Waybills"),
            path: isMerchant ? "/merchant/view-merchant-waybill/" + user.id : "/merchant/waybills",
            icon: UserCheck,
            permission: can("Merchant access"),
          },
        ],
      },

      {
        label: t("Transfer Task Management"),
        url: "#",
        items: [
          {
            label: t("Shipment Transfer Tasks"),
            path: "/shipments/transfer-tasks",
            icon: UserCheck,
            permission: true, //can("ShipmentTransfer access"),
          },
          {
            label: t("Tranfers Areas"),
            path: "/transfer-areas",
            icon: UserCheck,
            permission: true // can("Merchant access"),
          },
          {
            label: t("Truck"),
            path: "/trucks",
            icon: UserCheck,
            permission: true // can(" access"),
          },
          {
            label: t("Truck Driver"),
            path: "/truck-drivers",
            icon: UserCheck,
            permission: true // can(" access"),
          },
        ],
      },
      {
        label: t("Shelf Management"),
        url: "#",
        items: [
          {
            label: t("Shelf Categories"),
            path: "/shelf-categories",
            icon: CarFront,
            permission: can("Shelf Category access"),
          },
          {
            label: t("Shelf"),
            path: "/shelves",
            icon: User2Icon,
            permission: can("Shelf access"),
          },
        ],
      },

      {
        label: t("Financials"),
        url: "#",
        items: [
          {
            label: t("Expenses"),
            path: "/expenses",
            icon: Home,
            permission: can("Expense access"),
          },
        ],
      },
      {
        label: t("Shipment"),
        url: "",
        items: [
          {
            label: t("Shipments"),
            path: "/shipments",
            icon: Home,
            permission: can("Shipment access"),
          },
          {
            label: t("Shipment Status"),
            path: "/shipment-status",
            icon: Home,
            permission: can("Shipment Status access"),
          },
          {
            label: t("Operation"),
            path: "/update-shipment-status",
            icon: Home,
            permission: can("Operation access"),
          },
        ],
      },
      {
        label: t("Package"),
        url: "#",
        items: [
          {
            label: t("Real Time Tracking"),
            path: "/realtime-tracking",
            icon: Home,
            permission: can("Realtime Tracking access"),
          },
          {
            label: t("Real Time Query"),
            path: "/realtime-query",
            icon: Home,
            permission: can("Realtime Query access"),
          },
          {
            label: t("Assign Shipment"),
            path: "/assign-shipment",
            icon: Home,
            permission: true, //can("AssignShipment access"),
          },
          {
            label: t("Assign Shipment To Shelf"),
            path: "/assign-shipment-to-shelf",
            icon: Home,
            permission: can("Assign Shipment To Shelf access"),
          },
          {
            label: t("Driver Shipments"),
            path: "/driver-shipments",
            icon: Home,
            permission: true, //can("AssignShipment access"),
          },
          {
            label: t("Delivery Exceptions"),
            path: "/delivery-exceptions",
            icon: StopCircle,
            permission: can("Delivery Exception access"),
          },
        ],
      },
      {
        label: t("User Management"),
        url: "#",
        items: [
          {
            label: t("Users"),
            path: "/users",
            icon: Home,
            permission: can("User access"),
          },
          {
            label: t("Drivers"),
            path: "/drivers",
            icon: Home,
            permission: can("User access"),
          },
        ],
      },
      {
        label: t("Zone"),
        url: "#",
        items: [
          {
            label: t("Zones"),
            path: "/zones",
            icon: Home,
            permission: can("Zone access"),
          },
        ],
      },

      {
        label: t("Sorter"),
        url: "#",
        items: [
          {
            label: t("Sort Shipment"),
            path: "/sorter/sort-shipment",
            icon: Home,
            permission: true, //can("SortShipment access"),
          },
          {
            label: t("Load Shipment"),
            path: "/sorter/load-shipments",
            icon: Home,
            permission: true, //can("LoadShipment access"),
          },
          {
            label: t("Unload Shipment"),
            path: "/sorter/unload-shipments",
            icon: Home,
            permission: true, //can("LoadShipment access"),
          },
        ],
      },
      {
        label: t("CRM Management"),
        url: "#",
        items: [
          {
            label: t("Scenarios"),
            path: "/crm-scenarios",
            icon: Home,
            permission: can("CRM Scenario access"),
          },
          {
            label: t("Complaints"),
            path: "/crm-complaints",
            icon: Home,
            permission: can("CRM Complaint access"),
          },
          {
            label: t("Tasks"),
            path: "/crm-tasks",
            icon: Home,
            permission: can("CRM Task access"),
          },
        ],
      },
      {
        label: t("Pickup Management"),
        url: "#",
        items: [
          {
            label: t("Pickup Task"),
            path: "/pickup-tasks",
            icon: Home,
            permission: can("Pickup Task access"),
          },
        ],
      },
      {
        label: t("HR Management"),
        url: "#",
        items: [
          {
            label: t("Employee Department"),
            path: "/employee-department",
            icon: Home,
            permission: can("Employee Department access"),
          },
          {
            label: t("Employee Position"),
            path: "/employee-position",
            icon: Home,
            permission: can("Employee Position access"),
          },
          {
            label: t("Employees"),
            path: "/employees",
            icon: Home,
            permission: can("Employee access"),
          },
          {
            label: t("Employee Branches"),
            path: "/employee-branches",
            icon: Home,
            permission: can("Employee Branch access"),
          },
          {
            label: t("Employee Work Times"),
            path: "/employee-work-times",
            icon: Home,
            permission: can("Work Time access"),
          },
          {
            label: t("Employee Payrolls"),
            path: "/employee-payrolls",
            icon: Home,
            permission: can("Employee Payroll access"),
          },
          {
            label: t("Hierarchy Level"),
            path: "/hierarchy-level",
            icon: Home,
            permission: can("Hierarchy Level access"),
          },
          {
            label: t("Employee Hierarchies"),
            path: "/employee-hierarchies",
            icon: Home,
            permission: can("Employee Hierarchy access"),
          },
          {
            label: t("Leave Reasons"),
            path: "/leave-reasons",
            icon: Home,
            permission: can("Leave Reason access"),
          },
          {
            label: t("Leave Requests"),
            path: "/leave-requests",
            icon: Home,
            permission: true,
          },
          {
            label: t("Leave Request Approvals"),
            path: "/leave-request-approvals",
            icon: Home,
            permission: true,
          },
        ],
      },
      {
        label: t("Driver"),
        url: "#",
        items: [
          {
            label: t("My Shipments"),
            path: "/my-shipments",
            icon: Home,
            permission: true, //can("MyShipments access"),
          },
          {
            label: t("My Pickup Task"),
            path: "/my-pickup-task",
            icon: Home,
            permission: true, //can("MyShipments access"),
          },
        ],
      },
    ],
  };

  const filteredNavItems = items.navMain.filter((group) => {
    const filteredItems =
      group.items?.filter((item) => {
        const matchesSearch = item.label
          ?.toLowerCase()
          .includes(search.toLowerCase());
        const hasPermission = item.permission;
        return matchesSearch && hasPermission;
      }) || [];

    const groupMatches = group.label
      ?.toLowerCase()
      .includes(search.toLowerCase());
    group.items = filteredItems;
    return groupMatches || filteredItems.length > 0;
  });

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">
                    Ra7al Express - {user.role?.name}
                  </span>
                  {/* <span className=""></span> */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarMenu className="space-y-1">
                        {filteredNavItems.map((item, index) => (
                            <Collapsible
                                key={item.label}
                                defaultOpen={index === 1}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem
                                    className="rounded-md transition-colors hover:bg-accent hover:text-accent-foreground">
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium">
                                            {item.label}
                                            <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:hidden" />
                                            <Minus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]/collapsible:hidden" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    {item.items?.length ? (
                                        <CollapsibleContent className="space-y-1 px-2">
                                            <SidebarMenuSub>
                                                {item.items.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.label}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={subItem.isActive}
                                                            className={`w-full rounded-md px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${subItem.isActive
                                                                ? 'bg-accent text-accent-foreground'
                                                                : 'text-muted-foreground'
                                                                }`}
                                                        >
                                                            <Link to={subItem.path}>{subItem.label}</Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    ) : null}
                                </SidebarMenuItem>
                            </Collapsible>
                        ))}
                    </SidebarMenu> */}
          <SidebarMenu>
            {items.navMain.map((item, index) => (
              <Collapsible
                key={item.label}
                defaultOpen={index === 1}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.label}{" "}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((item) => (
                          <SidebarMenuSubItem key={item.label}>
                            <SidebarMenuSubButton asChild>
                              <Link to={item.path}>{item.label}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
