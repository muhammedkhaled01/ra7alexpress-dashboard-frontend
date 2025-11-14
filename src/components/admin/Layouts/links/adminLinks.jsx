import { can, hasRole } from "@/utils/helpers";
import { navConfig } from "@/utils/navConfig";
import { useSelector } from "react-redux";

export function getAdminLinks(t) {
  const user = useSelector((state) => state.auth.user);
  const isMerchant = hasRole("Merchant");

  return navConfig.map((category) => ({
    ...category,
    label: t(category.label),
    permission: category.permissionKeys.some((key) => can(key)),
    items: category.items.map((item) =>
      item.items
        ? {
          ...item,
          label: t(item.label),
          permission: item.permissionKeys.some((key) => can(key)),
          items: item.items.map((subItem) => ({
            ...subItem,
            label: t(subItem.label),
            permission: can(subItem.permissionKey),
          })),
        }
        : {
          ...item,
          label: t(item.label),
          path:
            item.label === "Merchant Waybills" && isMerchant && user?.id
              ? item.dynamicPath(user.id)
              : item.path,
          permission: Array.isArray(item.permission)
            ? hasRole(item.permission.slice(0, -1)) || can(item.permission[item.permission.length - 1])
            : can(item.permissionKey),
        }
    ),
  }));
}

export const sidebarPermissions = navConfig.map((category) => ({
  name: category.label,
  id: `category_${category.label.toLowerCase().replace(/ /g, '_')}`,
  icon: category.icon,
  children: category.items.flatMap((item) =>
    item.items
      ? item.items.map((subItem) => ({
          name: subItem.label,
          id: subItem.permissions[0].id, // Use first permission ID
          icon: subItem.icon,
          children: [],
        }))
      : [{
          name: item.label,
          id: `item_${item.label.toLowerCase().replace(/ /g, '_')}`, // Use unique label-based ID
          icon: item.icon,
          children: item.permissions.map((perm) => ({
            name: perm.name, // Use name like "View", "Create", "Edit"
            id: perm.id,
            children: [],
          })),
        }]
  ),
}));

export function useSidebarPermissions(t) {
  const adminLinks = getAdminLinks(t);
  return adminLinks.map((category) => ({
    name: category.label,
    id: `category_${category.label.toLowerCase().replace(/ /g, '_')}`,
    icon: category.icon,
    children: category.items.flatMap((item) =>
      item.items
        ? item.items.map((subItem) => ({
            name: subItem.label,
            id: subItem.permissions[0].id,
            icon: subItem.icon,
            children: [],
          }))
        : [{
            name: item.label,
            id: `item_${item.label.toLowerCase().replace(/ /g, '_')}`, // Use unique label-based ID
            icon: item.icon,
            children: item.permissions.map((perm) => ({
              name: perm.name,
              id: perm.id,
              children: [],
            })),
          }]
    ),
  }));
}