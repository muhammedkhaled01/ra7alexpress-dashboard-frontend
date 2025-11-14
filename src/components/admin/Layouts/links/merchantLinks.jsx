import { can } from "@/utils/helpers";
import {
  Bell,
  Home,
  MapPin,
  Package,
  CreditCard,
  BarChart,
  Tag, Headset,
} from "lucide-react";
import { useSelector } from "react-redux";

export function getMerchantLinks(t) {
  const user = useSelector((state) => state.auth.user);
  const clean = (s) => (typeof s === "string" ? s.replace(/\*/g, "") : s);
  return [
    {
      label: t("Dashboard"),
      icon: Home,
      alwaysOpen: true,
      items: [
        {
          label: t("Overview"),
          path: "/dashboard",
          icon: BarChart,
          permission: can("Merchant Dashboard access"),
        },
        {
          label: t("Merchant Summary"),
          path: "/merchant-summary",
          icon: BarChart,
          permission: can("Merchant Summary access"),
        },
        {
          label: t("Notifications"),
          path: "/notifications",
          icon: Bell,
          permission: can("Merchant Notification access"),
        },
        {
          label: t("Request Support"),
          path: "/request-support",
          icon: Headset,
          permission: can("Merchant Support access"),
        },
      ],
    },

    {
      label: t("Shipment Management"),
      alwaysOpen: true,
      icon: Package,
      items: [
        {
          label: t("Shipments"),
          path: "/shipments",
          icon: Package,
          permission: can("Merchant Waybill access"),
        },
        {
          label: t("Merchant Waybills"),
          path: "/merchant/view-merchant-waybill/" + user.id,
          icon: Tag,
          permission: can("Merchant Waybill access"),
        },
        {
          label: t("Merchant Address Book"),
          path: "/address-book",
          icon: MapPin,
          permission: can("Merchant Address Book access"),
        },
      ],
    },

    {
      label: t("Billing & Payments"),
      alwaysOpen: true,
      icon: CreditCard,
      items: [
        {
          label: clean(t("Wallet & Recharge")),
          path: "/merchants/MerchantWallet",
          icon: CreditCard,
          permission: can("Merchant Wallet access"),
        },
      ],
    },
  ];
}