import MerchantAddressBookIndex from "@/components/merchants/MerchantAddressBooks/Index";
import MerchantBranchIndex from "@/components/merchants/MerchantBranches/Index";
import MerchantBranchCreate from "@/components/merchants/MerchantBranches/Create";
import MerchantBranchEdit from "@/components/merchants/MerchantBranches/Edit";
import MerchantShipmentsLiveTracking from "@/components/merchants/MerchantShipmentsLiveTracking";
import MerchantCustomerNotifications from "@/components/merchants/MerchantCustomerNotifications";
import MerchantBulkShipmentCreate from "@/components/admin/Shipments/MerchantBulkShipmentCreate";
import { MerchantSummary } from "@/components/admin/MerchantSummary";
import Wallet from "@/components/admin/Merchants/MerchantWallet";

const merchantRoutes = [
  {
    name: "address-book",
    path: "/address-book",
    element: <MerchantAddressBookIndex />,
  },
  {
    name: "branches",
    path: "/merchant/branches",
    element: <MerchantBranchIndex />,
  },
  {
    name: "branches-create",
    path: "/merchant/branches/create-branch",
    element: <MerchantBranchCreate />,
  },
  {
    name: "branches-edit",
    path: "/merchant/branches/edit-branch/:id",
    element: <MerchantBranchEdit />,
  },
  {
    name: "live-tracking",
    path: "/live-tracking",
    element: <MerchantShipmentsLiveTracking />,
  },
  {
    name: "customer-notifications",
    path: "/customer-notifications",
    element: <MerchantCustomerNotifications />,
  },
  {
    name: "bulk-shipments-create",
    path: "merchant/shipments/bulk-shipments-create",
    element: <MerchantBulkShipmentCreate />,
  },
  {
    name: "merchant-summary",
    path: "/merchant/summary",
    element: <MerchantSummary />,
  },
  {
    name: "merchant wallet",
    path: "merchants/MerchantWallet",
    element: <Wallet />,
  },
];

export default merchantRoutes;
