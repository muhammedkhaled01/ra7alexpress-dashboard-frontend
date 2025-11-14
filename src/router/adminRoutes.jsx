import AdminProfile from "@/components/admin/AdminProfile";
import AdminSetting from "@/components/admin/AdminSetting";
import BranchIndex from "@/components/admin/Branches/Index";
import CityIndex from "@/components/admin/Cities/Index";
import MerchantIndex from "@/components/admin/Merchants/Index";
import ConsigneeIndex from "@/components/admin/Consignees/Index";
import GovernorateIndex from "@/components/admin/Governorates/Index";
import HubIndex from "@/components/admin/Hub/Index";
import ShipmentCreate from "@/components/admin/Shipments/Create";
import ShipmentIndex from "@/components/admin/Shipments/Index";
import FutureShipment from "@/components/admin/Shipments/FutureShipments";
import PickupUnassignedShipmentsPage from "@/components/admin/Shipments/PickupUnassignedShipmentsPage";
import UnregisteredShipmentsIndex from "@/components/admin/Shipments/UnregisteredShipmentsIndex";

import OutsourcedShipmentCreate from "@/components/admin/OutsourcedShipment/Create";
import OutsourcedShipment from "@/components/admin/OutsourcedShipment/Index";
import ShipmentStatus from "@/components/admin/ShipmentStatus/Index";
import PermissionIndex from "@/components/admin/Permissions/Index";
import PlaceIndex from "@/components/admin/Places/Index";
import RoleCreate from "@/components/admin/Roles/Create";
import RoleEdit from "@/components/admin/Roles/Edit";
import RoleIndex from "@/components/admin/Roles/Index";
import ShipperIndex from "@/components/admin/Shippers/Index";
import StateIndex from "@/components/admin/States/Index";
import StationIndex from "@/components/admin/Stations/Index";
import ZoneCreate from "@/components/admin/Zones/Create";
import ZoneEdit from "@/components/admin/Zones/Edit";
import ZoneIndex from "@/components/admin/Zones/Index";
import HubCreate from "@/components/admin/Hub/Create";
import HubView from "@/components/admin/Hub/View";
import HubEdit from "@/components/admin/Hub/Edit";
import MyShipments from "@/components/admin/DriverShipments/MyShipments";
import RealtimeQuery from "@/components/admin/Shipments/RealtimeQuery";
import ShelfIndex from "@/components/admin/Shelf/Index";
import ShelfCategoryIndex from "@/components/admin/ShelfCategory/Index";
import UserCreate from "@/components/admin/Users/Create";
import BranchUserCreate from "@/components/admin/Users/CreateBranchUser";
import CreateDriver from "@/components/admin/Users/CreateDriver";
import HubUserCreate from "@/components/admin/Users/CreateHubUser";
import StationUserCreate from "@/components/admin/Users/CreateStationUser";
import DriverEdit from "@/components/admin/Users/DriverEdit";
import UserEdit from "@/components/admin/Users/UserEdit";
import UserIndex from "@/components/admin/Users/Index";
import MerchantCreate from "@/components/admin/Merchants/Create";
import MerchantWaybillCreate from "@/components/admin/MerchantWaybill/Create";
import MerchantWaybillIndex from "@/components/admin/MerchantWaybill/Index";
import MerchantWaybillView from "@/components/admin/MerchantWaybill/View";
import DriverWaybillCreate from "@/components/admin/DriverWaybill/Create";
import DriverWaybillIndex from "@/components/admin/DriverWaybill/Index";
import DriverWaybillView from "@/components/admin/DriverWaybill/View";
import CRMTasksIndex from "@/components/admin/CRMTasks/Index";
import DeliveryExceptionIndex from "@/components/admin/DeliveryExceptions/Index";
import ExpenseIndex from "@/components/admin/Expenses/Index";
import TransferFeesIndex from "@/components/admin/TransferFees/Index";
import TransferIndex from "@/components/admin/Transfers/Index";
import EmployeeBranchsIndex from "@/components/admin/HRM/EmployeeBranches/Index";
import EmployeeDepartmentsIndex from "@/components/admin/HRM/EmployeeDepartments/Index";
import EmployeeHierarchyIndex from "@/components/admin/HRM/EmployeeHierarchies/Index";
import EmployeePayrollIndex from "@/components/admin/HRM/EmployeePayrolls/Index";
import EmployeePositionsIndex from "@/components/admin/HRM/EmployeePositions/Index";
import EmployeesIndex from "@/components/admin/HRM/Employees/Index";
import HierarchyLevelsIndex from "@/components/admin/HRM/HierarchyLevels/Index";
import LeaveReasonsIndex from "@/components/admin/HRM/LeaveReasons/Index";
import LeaveRequestApprovalIndex from "@/components/admin/HRM/LeaveRequestApprovals/Index";
import LeaveRequestIndex from "@/components/admin/HRM/LeaveRequests/Index";
import WorkTimeIndex from "@/components/admin/HRM/WorkTime/Index";
import AssignShipment from "@/components/admin/Shipments/AssignShipment";
import AssignShipmentToShelf from "@/components/admin/Shipments/AssignShipmentToShelf";
import MerchantShipmentCreate from "@/components/admin/Shipments/MerchantShipmentCreate";
import CreateCustomerShipment from "@/components/admin/Shipments/CreateCustomerShipment";
import DriverShipments from "@/components/admin/Shipments/DriverShipments";
import RealtimeTracking from "@/components/admin/Shipments/RealtimeTracking";
import SettingIndex from "@/components/admin/Settings/Index";
import LoadShipment from "@/components/admin/Sorter/LoadShipment";
import SortShipment from "@/components/admin/Sorter/SortShipment";
import TransferTaskCreate from "@/components/admin/TransferTask/Create";
import TransferTaskIndex from "@/components/admin/TransferTask/Index";
import UnitIndex from "@/components/admin/Units/Index";
import DeliveryCommission from "@/components/admin/Users/DeliveryComission";
import DriversIndex from "@/components/admin/Users/Drivers";
import ZoneShipments from "@/components/admin/Zones/Shipments";
import TransferAreas from "@/components/admin/TransferTask/TransferAreas";
import TransferTaskView from "@/components/admin/TransferTask/View";
import PickupTasksIndex from "@/components/admin/PickupTasks/Index";
import UnloadShipment from "@/components/admin/Sorter/UnloadShipment";
import TruckIndex from "@/components/admin/Truck/Index";
import TruckDriverIndex from "@/components/admin/TruckDriver/Index";
import MyPickupTask from "@/components/admin/DriverShipments/MyPickupTask";
import Operation from "@/components/admin/Shipments/Operation";
import ShipmentProblems from "@/components/admin/Shipments/ShipmentProblems";
import ShelfShipments from "@/components/admin/Shelf/Shipments";
import PickupAssignShipment from "@/components/admin/PickupTasks/PickupAssignShipment";
import QualityCheck from "@/components/admin/QualityCheck/QualityCheck";
import OFDList from "@/components/admin/QualityCheck/OFDList";
import DriverCommissionIndex from "@/components/admin/DriverCommissions/Index";
import IncomingTrucks from "@/components/admin/TransferTask/IncomingTrucks";
import DriverRunsheet from "@/components/admin/QualityCheck/DriverRunsheet";
import CODTabs from "@/components/admin/Finance/CODTabs";
import MerchantAccounts from "@/components/admin/Merchants/Accounts";
import DriverAccounts from "@/components/admin/Users/DriverAccounts";
import PartnersTabs from "@/components/admin/Partners/PartnersTabs";
import BranchAccounts from "@/components/admin/Branches/BranchAccount";
import StationAccounts from "@/components/admin/Stations/StationAccount";
import HubAccounts from "@/components/admin/Hub/HubAccount";
import DriverInvoiceTabs from "@/components/admin/Users/DriverInvoiceTabs";
import FineIndex from "@/components/admin/QualityCheck/FineIndex";
import CompanyIndex from "@/components/admin/Company/Index";
import FinancialIndex from "@/components/admin/AdminFinancialRequestsPage";
import CompanyAccount from "@/components/admin/Company/CompanyAccount";
import CountryChannel from "@/components/admin/Company/CountryChannel";
import GovernorateChannel from "@/components/admin/Company/GovernorateChannel";
import StateChannel from "@/components/admin/Company/StateChannel";
import MerchantInvoiceTabs from "@/components/admin/Merchants/MerchantInvoiceTabs";
import FinanceMerchantInvoiceTabs from "@/components/admin/Finance/MerchantInvoices/FinanceMerchantInvoiceTabs";
import ShipperCommission from "@/components/admin/Shippers/ShipperComission";
import ShipperAccounts from "@/components/admin/Shippers/ShipperAccounts";
import CompanyCommission from "@/components/admin/Company/CompanyCommissions";
import CompanyDriverInvoices from "@/components/admin/Company/DriverInvoices";
import Notifications from "@/components/admin/Notifications";
import CompanyCommissionImport from "@/components/admin/Company/CompanyCommissionsImport";
import TruckView from "@/components/admin/Truck/View";
import DriverBonus from "@/components/admin/Users/DriverBonus";
// import StockOutSort from "@/components/admin/Sorter/StockOutSort";
// import StockOutIndex from "@/components/admin/Shelf/StockOutTasks/Index";
import ShelfShipmentsIndex from "@/components/admin/Shelf/ShelfShipmentsIndex";
import WhatsappTemplateIndex from "@/components/admin/WhatsappTemplates/Index";
import Reprint from "@/components/admin/Shipments/Reprint";
import { Analytics } from "@/components/admin/Analytics";
import Alerts from "@/components/admin/Alerts";
import QuickStats from "@/components/admin/QuickStats";
import DailySummary from "@/components/admin/DailySummary";
import ReturnIndex from "@/components/admin/Returns";
import ShipmentReport from "@/components/admin/Reports";
import DriverPerformance from "@/components/admin/DriverShipments/DriverPerformance";
import FinancialReports from "@/components/admin/Reports/FinancialReports";
import ActivityLogs from "@/components/admin/Activity/ActivityLogs";
// import UserActions from "@/components/admin/Activity/UserActions";
import LoginHistory from "@/components/admin/Activity/LoginHistory";
import UserActions from "@/components/admin/actions/UserActions";
import SessionsManagement from "@/components/admin/Activity/SessionsManagement";
import CustomAlerts from "@/components/admin/Automation/CustomAlerts";
import RulesEngine from "@/components/admin/Automation/RulesEngine";
import AutomatedTasks from "@/components/admin/Automation/AutomatedTasks";
import ScheduledActions from "@/components/admin/Automation/ScheduledActions";
import DeliverySlots from "@/components/admin/DeliveryScheculing/DeliverySlots";
import DeliverySchedule from "@/components/admin/DeliveryScheculing/DeliverySchedule";
import DeliveryReminders from "@/components/admin/DeliveryScheculing/DeliveryReminders";
import GpsTracking from "@/components/admin/Route Optimizing/GpsTracking";
import FuelEfficiencyReports from "@/components/admin/Route Optimizing/FuelEfficiencyReports";
import Tickets from "@/components/admin/Customer Support/Tickets";
import ContactHistory from "@/components/admin/Customer Support/ContactHistory";
import Vehicles from "@/components/admin/Fleet Management/Vehicles";
import VehicleStatus from "@/components/admin/Fleet Management/VehicleStatus";
import DriverStatus from "@/components/admin/Fleet Management/DriverStatus";
import OnTimeDeliveryRate from "@/components/admin/KPI Tracking/OnTimeDeliveryRate";
import ShipmentFulfillmentRate from "@/components/admin/KPI Tracking/ShipmentFulfillmentRate";
import StockLevels from "@/components/admin/Shelf/StockOutTasks/StockLevels";
import LowStockAlerts from "@/components/admin/Shelf/StockOutTasks/LowStockAlerts";
import LegalDocuments from "@/components/admin/LegalDocuments/Index";
// import ComplianceChecklists from './../components/admin/Compliance & Safety/ComplianceChecklists';
import DriverAppSetting from "@/components/admin/DriverAppSetting";
import Zones from "@/components/admin/Zones/ZonesMap";
import TrackShipment from "@/components/admin/Shipments/TrackShipments";
import ShipmentHistory from "@/components/admin/Shipments/Shipment History";
import StationCreate from "@/components/admin/Stations/Create";
import BranchCreate from "@/components/admin/Branches/Create";
import RoutePlanning from "@/components/admin/Route Optimizing/RoutePlanning";
import MaintenanceScheduleIndex from "@/components/admin/Fleet Management/MaintenanceScheduleIndex";
import ComplianceChecklistIndex from "@/components/admin/Compliance/Index";
import SafetyIncidentIndex from "@/components/admin/SafetyIncidents/Index";
import SafetyIncidentView from "@/components/admin/SafetyIncidents/View";
import StockInOut from "@/components/admin/Shelf/StockOutTasks/StockInOut";
import AddressUpdates from "@/components/admin/QualityCheck/AddressUpdates";
import CRMScenariosIndex from "@/components/admin/CRMScenarios/Index";
import MerchantProfile from "@/components/admin/Merchants/View";
import MerchantNotifications from "@/components/admin/MerchantNotifications";
import ScheduledMessages from "@/components/merchant/communication/scheduled-messages";
import CustomDeclarations from "@/components/merchant/shipments-management/custom-declarations";
import ShipmentRulesEngine from "@/components/merchant/shipments-management/shipment-rules-engine";
import WhatsappIntegrations from "@/components/merchant/notifications-and-communications/whatsapp-integrations";
import NotificationCenter from "@/components/merchant/notifications-and-communications/notification-center";
import CustomerCreatedShipments from "@/components/admin/CustomerCreatedShipments";
import { MerchantSummary } from "@/components/admin/MerchantSummary";
import GuestDrivers from "@/components/admin/Outsourced/GuestDrivers";
import GuestCustomers from "@/components/admin/Outsourced/GuestCustomers";
import GuestDriverShipments from "@/components/admin/Outsourced/GuestDriverShipments";
import LiveChatRefactored from "@/components/admin/Customer Support/LiveChatRefactored";
import StationEdit from "@/components/admin/Stations/Edit";
import StockOutSort from "@/components/admin/Sorter/StockOutSort";
import StockOutIndex from "@/components/admin/Shelf/StockOutTasks/Index";
import BranchEdit from "@/components/admin/Branches/Edit";
import MerchantEdit from "@/components/admin/Merchants/Edit";
// import ShipmentIndexCondensed from "@/components/admin/Shipments/IndexCondensed";
import CRMComplaints from "@/components/admin/CRMTasks/Complaints";
import FinanceDriverInvoicePending from "@/components/admin/Finance/DriverInvoices/FinanceDriverInvoicePending";
import MerchantCommission from "@/components/admin/MerchantCommissions/Index";
import ArchivedShipments from "@/components/admin/Shipments/ArchivedShipments";
import Wallet from "@/components/admin/Merchants/Wallet";
import ManifestManagement from "@/components/admin/Merchants/ManifestManagement";
import WebSocketTest from "@/components/WebSocketTest";
import MerchantChatDashboard from "@/components/admin/Customer Support/MerchantChatDashboard.jsx";
import RequestSupport from "@/components/admin/Customer Support/RequestSupport.jsx";
import DriversAccountTable from "@/components/admin/Users/DriversAccountTable.jsx";
import MerchantAccountsTable from "@/components/admin/Merchants/MerchantAccountsTable.jsx";
import WarehouseAccountsTable from "@/components/admin/WarehouseAccounts";
import DriverWarningsIndex from "@/components/admin/QualityCheck/DriverWarningsIndex.jsx";
import CreateUnAssignedShipment from "@/components/admin/Shipments/CreateUnAssignedShipment.jsx";
import FinancialRequestsPage from "@/components/admin/Hub/FinancialRequestsPage";
import ViewBatchWaybills from "@/components/admin/MerchantWaybill/ViewBatchWaybills.jsx";
import DriverViewBatchWaybills from "@/components/admin/DriverWaybill/ViewBatchWaybills.jsx";
import TransferTaskCreateNew from "@/components/admin/TransferTask/CreateNew";
import SaveRole from "@/components/admin/Roles/SaveRole";
const adminRoutes = [
  {
    index: true,
    name: "Analytics",
    element: <Analytics />,
  },
  {
    name: "Analytics",
    path: "dashboard",
    element: <Analytics />,
  },
  {
    name: "Quick-state",
    path: "quick-stats",
    element: <QuickStats />,
  },
  {
    name: "Alerts",
    path: "alerts",
    element: <Alerts />,
  },
  {
    name: "DailySummary",
    path: "daily-summary",
    element: <DailySummary />,
  },
  {
    name: "setting",
    path: "setting",
    element: <AdminSetting />,
  },
  // {
  //   name: "profile",
  //   path: "profile",
  //   element: <AdminProfile />,
  // },
  {
    name: "states",
    path: "states",
    element: <StateIndex />,
  },

  {
    name: "governorates",
    path: "governorates",
    element: <GovernorateIndex />,
  },

  {
    name: "places",
    path: "places",
    element: <PlaceIndex />,
  },

  {
    name: "cities",
    path: "cities",
    element: <CityIndex />,
  },
  {
    name: "hubs",
    path: "hubs",
    element: <HubIndex />,
  },

  {
    name: "hubCreate",
    path: "hubs/create-hub",
    element: <HubCreate />,
  },
  {
    name: "hubEdit",
    path: "hubs/edit-hub/:id",
    element: <HubEdit />,
  },

  {
    name: "hubView",
    path: "hubs/view/:id",
    element: <HubView />,
  },
  {
    name: "stations",
    path: "stations",
    element: <StationIndex />,
  },
  {
    name: "stationsCreate",
    path: "stations/create-station",
    element: <StationCreate />,
  },
  {
    name: "stationsEdit",
    path: "stations/edit-station/:id",
    element: <StationEdit />,
  },
  {
    name: "branches",
    path: "branches",
    element: <BranchIndex />,
  },
  {
    name: "branchesCreate",
    path: "branches/create-branch",
    element: <BranchCreate />,
  },
  {
    name: "branchesEdit",
    path: "branches/edit-branch/:id",
    element: <BranchEdit />,
  },
  {
    name: "branchesAccounts",
    path: "branches/accounts/:id",
    element: <BranchAccounts />,
  },
  {
    name: "stationsAccounts",
    path: "stations/accounts/:id",
    element: <StationAccounts />,
  },
  {
    name: "hubsAccounts",
    path: "hubs/accounts/:id",
    element: <HubAccounts />,
  },
  {
    name: "hubsFinancialRequests",
    path: "hubs/:id/financial-requests",
    element: <FinancialRequestsPage />,
  },
  {
    name: "stationsFinancialRequests",
    path: "stations/:id/financial-requests",
    element: <FinancialRequestsPage />,
  },
  {
    name: "shelves",
    path: "shelves",
    element: <ShelfIndex />,
  },
  {
    name: "shelfShipments",
    path: "shelves/shipments/:barcode",
    element: <ShelfShipments />,
  },
  {
    name: "shelf_categories",
    path: "shelf-categories",
    element: <ShelfCategoryIndex />,
  },
  {
    name: "shipments",
    path: "shipments",
    element: <ShipmentIndex />,
  },
  {
    name: "futureShipments",
    path: "future-shipments",
    element: <FutureShipment />,
  },
  { path: "outsourced-shipment", element: <OutsourcedShipment /> },
  {
    path: "/shipments/pickup-unassigned",
    element: <PickupUnassignedShipmentsPage />,
  },
  {
    path: "/shipments/unregistered",
    element: <UnregisteredShipmentsIndex />,
  },
  // {
  //   name: "shipmentsCondensed",
  //   path: "shipments-condensed",
  //   element: <ShipmentIndexCondensed />,
  // },
  {
    name: "shipment_status",
    path: "shipment-status",
    element: <ShipmentStatus />,
  },
  {
    name: "update-shipment-status",
    path: "update-shipment-status",
    element: <Operation />,
  },
  {
    name: "create-unassigned-shipment",
    path: "create-unassigned-shipment",
    element: <CreateUnAssignedShipment />,
  },
  {
    name: "reprint",
    path: "/reprint",
    element: <Reprint />,
  },
  {
    name: "ndr",
    path: "ndr",
    element: <ShipmentProblems />,
  },
  {
    name: "shipmentsCreate",
    path: "shipments/create-shipment",
    element: <ShipmentCreate />,
  },
  {
    name: "outsourcedshipmentCreate",
    path: "/create-outsourced-shipment",
    element: <OutsourcedShipmentCreate />,
  },
  {
    name: "merchantShipmentsCreate",
    path: "merchant/shipments/create",
    element: <MerchantShipmentCreate />,
  },
  {
    name: "merchantsInvoices",
    path: "merchants/invoices/:id",
    element: <MerchantInvoiceTabs />,
  },
  {
    name: "create_customer_shipment",
    path: "shipments/create_customer_shipment",
    element: <CreateCustomerShipment />,
  },
  {
    name: "RealtimeTracking",
    path: "realtime-tracking",
    element: <RealtimeTracking />,
  },
  {
    name: "RealtimeQuery",
    path: "realtime-query",
    element: <RealtimeQuery />,
  },
  {
    name: "assignShipment",
    path: "assign-shipment",
    element: <AssignShipment />,
  },
  {
    name: "assignShipmentToShelf",
    path: "assign-shipment-to-shelf",
    element: <AssignShipmentToShelf />,
  },
  {
    name: "driverShipments",
    path: "driver-shipments",
    element: <DriverShipments />,
  },
  {
    name: "merchants",
    path: "merchants",
    element: <MerchantIndex />,
  },
  {
    name: "merchant wallet",
    path: "merchants/wallet/:id",
    element: <Wallet />,
  },
  {
    name: "manifest management",
    path: "manifest-management",
    element: <ManifestManagement />,
  },
  {
    name: "merchantsView",
    path: "merchants/:id/view",
    element: <MerchantProfile />,
  },

  {
    name: "returns",
    path: "returns",
    element: <ReturnIndex />,
  },
  {
    name: "shipment-reports",
    path: "shipment-reports",
    element: <ShipmentReport />,
  },
  {
    name: "driver-performance",
    path: "driver-performance",
    element: <DriverPerformance />,
  },
  {
    name: "merchantsCreate",
    path: "merchants/create-merchant",
    element: <MerchantCreate />,
  },
  {
    name: "merchantsEdit",
    path: "merchants/edit-merchant/:id",
    element: <MerchantEdit />,
  },
  {
    name: "merchantsCommission",
    path: "merchants/commissions/:id",
    element: <MerchantCommission />,
  },
  {
    name: "merchantsAccounts",
    path: "merchants/accounts/:id",
    element: <MerchantAccounts />,
  },
  {
    name: "MerchantAccountsTable",
    path: "merchants-accounts",
    element: <MerchantAccountsTable />,
  },
  {
    name: "warehouseAccountsTable",
    path: "workspace-accounts",
    element: <WarehouseAccountsTable />,
  },
  {
    name: "merchantWaybills",
    path: "merchant/waybills",
    element: <MerchantWaybillIndex />,
  },
  {
    name: "merchantWaybillsCreate",
    path: "create-merchant-waybill",
    element: <MerchantWaybillCreate />,
  },
  {
    name: "merchantWaybillsView",
    path: "merchant/view-merchant-waybill/:merchant_id",
    element: <MerchantWaybillView />,
  },
  {
    name: "driverWaybills",
    path: "driver/waybills",
    element: <DriverWaybillIndex />,
  },
  {
    name: "driverWaybillsCreate",
    path: "create-driver-waybill",
    element: <DriverWaybillCreate />,
  },
  {
    name: "driverWaybillsView",
    path: "driver/view-driver-waybill/:driver_id",
    element: <DriverWaybillView />,
  },
  {
    name: "merchantBulkWaybillsView",
    path: "merchant/:merchant_id/:batch_id/view-batch-waybill",
    element: <ViewBatchWaybills />,
  },
  {
    name: "driverBulkWaybillsView",
    path: "driver/:driver_id/:batch_id/view-batch-waybill",
    element: <DriverViewBatchWaybills />,
  },
  {
    name: "roles",
    path: "roles",
    element: <RoleIndex />,
  },
  {
    name: "rolesCreate",
    path: "roles/create-role",
    element: <SaveRole />,
  },
  {
    name: "rolesEdit",
    path: "roles/edit-role/:id",
    element: <SaveRole EditMode={true} />,
  },
  {
    name: "zones",
    path: "routing-rules",
    element: <ZoneIndex />,
  },
  {
    name: "zonesCreate",
    path: "routing-rules/create-route-rule",
    element: <ZoneCreate />,
  },
  {
    name: "zonesEdit",
    path: "routing-rules/edit-routing-rule/:id",
    element: <ZoneEdit />,
  },
  {
    name: "zonesEdit",
    path: "zones/shipments/:id",
    element: <ZoneShipments />,
  },
  {
    name: "shippers",
    path: "shippers",
    element: <ShipperIndex />,
  },
  {
    name: "shippersCommission",
    path: "shippers/commissions/:id",
    element: <ShipperCommission />,
  },
  {
    name: "shippersAccounts",
    path: "shippers/accounts/:id",
    element: <ShipperAccounts />,
  },
  {
    name: "consignees",
    path: "consignees",
    element: <ConsigneeIndex />,
  },
  {
    name: "users",
    path: "users",
    element: <UserIndex />,
  },
  {
    name: "driversIndex",
    path: "drivers",
    element: <DriversIndex />,
  },
  {
    name: "driversAccounts",
    path: "drivers/accounts/:id",
    element: <DriverAccounts />,
  },
  {
    name: "AllDriversAccounts",
    path: "drivers-accounts",
    element: <DriversAccountTable />,
  },
  {
    name: "driversInvoices",
    path: "salary-bill-details/:id",
    element: <DriverInvoiceTabs />,
  },
  {
    name: "driversCommission",
    path: "drivers/commissions/:id",
    element: <DriverCommissionIndex />,
  },

  {
    name: "deliveryCommission",
    path: "commissions/:driver_id",
    element: <DeliveryCommission />,
  },
  {
    name: "usersCreate",
    path: "users/create-user",
    element: <UserCreate />,
  },
  {
    name: "hubUserCreate",
    path: "create-hub-admin",
    element: <HubUserCreate />,
  },
  {
    name: "stationUserCreate",
    path: "create-station-admin",
    element: <StationUserCreate />,
  },
  {
    name: "branchUserCreate",
    path: "create-branch-admin",
    element: <BranchUserCreate />,
  },
  {
    name: "branchUserCreate",
    path: "users/create-driver",
    element: <CreateDriver />,
  },
  {
    name: "driversEdit",
    path: "drivers/edit/:id",
    element: <DriverEdit />,
  },
  {
    name: "usersEdit",
    path: "users/edit/:id",
    element: <UserEdit />,
  },

  {
    name: "permissions",
    path: "permissions",
    element: <PermissionIndex />,
  },
  {
    name: "expenses",
    path: "expenses",
    element: <ExpenseIndex />,
  },
  {
    name: "fees",
    path: "fees",
    element: <TransferFeesIndex />,
  },
  {
    name: "transfers",
    path: "transfers",
    element: <TransferIndex />,
  },
  {
    name: "units",
    path: "units",
    element: <UnitIndex />,
  },
  {
    name: "status-transition-config",
    path: "status-transition-config",
    element: <SettingIndex />,
  },
  {
    name: "deliveryExceptions",
    path: "delivery-exceptions",
    element: <DeliveryExceptionIndex />,
  },
  {
    name: "MyShipments",
    path: "my-shipments",
    element: <MyShipments />,
  },
  {
    name: "pickupAssignShipment",
    path: "assign-pickup-tasks",
    element: <PickupAssignShipment />,
  },
  {
    name: "MyPickupTask",
    path: "my-pickup-task",
    element: <MyPickupTask />,
  },
  // CRM Management Routes

  {
    name: "CRM Tasks",
    path: "crm-tasks",
    element: <CRMTasksIndex />,
  },
  {
    name: "CRM Complaints",
    path: "crm-complaints",
    element: <CRMComplaints />,
  },
  {
    name: "transferTask",
    path: "shipments/transfer-tasks",
    element: <TransferTaskIndex />,
  },
  {
    name: "transferTaskCreate",
    path: "shipments/create-transfer-task",
    element: <TransferTaskCreate />,
  },
  {
    name: "transferTaskCreate",
    path: "shipments/new-create-transfer-task",
    element: <TransferTaskCreateNew />,
  },
  {
    name: "transferTaskView",
    path: "shipments/transfer/tasks/view/:id",
    element: <TransferTaskView />,
  },
  {
    name: "transferTask",
    path: "transfer-areas",
    element: <TransferAreas />,
  },
  {
    name: "truck",
    path: "trucks/incoming",
    element: <IncomingTrucks />,
  },

  {
    name: "pickup-tasks",
    path: "pickup-tasks",
    element: <PickupTasksIndex />,
  },

  // Sorter Side
  {
    name: "sorter-sort-shipment",
    path: "/sorter/sort-shipment",
    element: <SortShipment />,
  },
  {
    name: "sorter-load-shipment",
    path: "/sorter/load-shipments",
    element: <LoadShipment />,
  },
  {
    name: "sorter-unload-shipment",
    path: "/sorter/unload-shipments",
    element: <UnloadShipment />,
  },

  {
    name: "trucks",
    path: "trucks",
    element: <TruckIndex />,
  },
  {
    name: "trucksView",
    path: "trucks/view/:truck_barcode",
    element: <TruckView />,
  },
  {
    name: "truckDrivers",
    path: "truck-drivers",
    element: <TruckDriverIndex />,
  },

  ///
  /// HRS
  ///
  // Employees
  {
    name: "Employee Department",
    path: "employee-department",
    element: <EmployeeDepartmentsIndex />,
  },
  {
    name: "Employee Position",
    path: "employee-position",
    element: <EmployeePositionsIndex />,
  },
  {
    name: "Employees",
    path: "employees",
    element: <EmployeesIndex />,
  },
  {
    name: "Employee Branches",
    path: "employee-branches",
    element: <EmployeeBranchsIndex />,
  },
  // Work Times & Payrolls
  {
    name: "Employee Work Times",
    path: "employee-work-times",
    element: <WorkTimeIndex />,
  },
  {
    name: "Employee Payrolls",
    path: "employee-payrolls",
    element: <EmployeePayrollIndex />,
  },
  // Leaves Management
  {
    name: "Hierarchy Level",
    path: "hierarchy-level",
    element: <HierarchyLevelsIndex />,
  },
  {
    name: "Employee Hierarchies",
    path: "employee-hierarchies",
    element: <EmployeeHierarchyIndex />,
  },
  {
    name: "Leave Reasons",
    path: "leave-reasons",
    element: <LeaveReasonsIndex />,
  },
  {
    name: "Leave Requests",
    path: "leave-requests",
    element: <LeaveRequestIndex />,
  },
  {
    name: "Leave Request Approvals",
    path: "leave-request-approvals",
    element: <LeaveRequestApprovalIndex />,
  },
  {
    name: "quality-check",
    path: "/quality-check",
    element: <QualityCheck />,
  },
  {
    name: "fines",
    path: "/fines",
    element: <FineIndex />,
  },
  {
    name: "driver-warnings",
    path: "/driver-warnings",
    element: <DriverWarningsIndex />,
  },
  {
    name: "ofd-list",
    path: "/ofd-list",
    element: <OFDList />,
  },
  {
    name: "driver-runsheet",
    path: "/driver-runsheet",
    element: <DriverRunsheet />,
  },
  {
    name: "financeDriverInvoicesTabs",
    path: "/salary-bill-management",
    element: <FinanceDriverInvoicePending />,
  },
  {
    name: "financeDriverInvoicesTabs",
    path: "drivers/salary-bill-management",
    element: <FinanceDriverInvoicePending />,
  },
  {
    name: "financial-reports",
    path: "/financial/reports",
    element: <FinancialReports />,
  },
  {
    name: "activity-logs",
    path: "/activity-logs",
    element: <ActivityLogs />,
  },
  {
    name: "user-actions",
    path: "/user-actions",
    element: <UserActions />,
  },
  {
    name: "sessions-management",
    path: "/sessions-management",
    element: <SessionsManagement />,
  },
  {
    name: "custom-alerts",
    path: "/custom-alerts",
    element: <CustomAlerts />,
  },
  {
    name: "rules-engine",
    path: "/rules-engine",
    element: <RulesEngine />,
  },
  {
    name: "automated-tasks",
    path: "/automated-tasks",
    element: <AutomatedTasks />,
  },
  {
    name: "delivery-slots",
    path: "/delivery/slots",
    element: <DeliverySlots />,
  },
  {
    name: "delivery/reminders",
    path: "/delivery/reminders",
    element: <DeliveryReminders />,
  },
  {
    name: "route-slots",
    path: "/route-slots",
    element: <RoutePlanning />,
  },
  {
    name: "gps-tracking",
    path: "/gps-tracking",
    element: <GpsTracking />,
  },
  {
    name: "fuel-efficiency-reports",
    path: "/fuel-efficiency-reports",
    element: <FuelEfficiencyReports />,
  },
  {
    name: "delivery/schedule",
    path: "/delivery/schedule",
    element: <DeliverySchedule />,
  },
  {
    name: "scheduled-actions",
    path: "/scheduled-actions",
    element: <ScheduledActions />,
  },
  {
    name: "login-history",
    path: "/login-history",
    element: <LoginHistory />,
  },
  {
    name: "financeMerchantInvoicesTabs",
    path: "/invoices/merchant",
    element: <FinanceMerchantInvoiceTabs />,
  },
  {
    name: "tickets",
    path: "/tickets",
    element: <Tickets />,
  },
  {
    name: "live-chat",
    path: "/live-chat/:chat_id?",
    element: <LiveChatRefactored />,
  },
  {
    name: "merchant-chat",
    path: "/merchant-chat",
    element: <MerchantChatDashboard />,
  },
  {
    name: "request-support",
    path: "/request-support",
    element: <RequestSupport />,
  },
  {
    name: "contact-history",
    path: "/contact-history",
    element: <ContactHistory />,
  },
  {
    name: "crm-scenarios",
    path: "/crm-scenarios",
    element: <CRMScenariosIndex />,
  },
  {
    name: "vehicles",
    path: "/vehicles",
    element: <Vehicles />,
  },
  {
    name: "maintenance-schedule",
    path: "/maintenance-schedule",
    element: <MaintenanceScheduleIndex />,
  },
  {
    name: "vehicle-status",
    path: "/vehicle-status",
    element: <VehicleStatus />,
  },
  {
    name: "on-time-delivery-rate",
    path: "/on-time-delivery-rate",
    element: <OnTimeDeliveryRate />,
  },
  {
    name: "shipment-fulfillment-rate",
    path: "/shipment-fulfillment-rate",
    element: <ShipmentFulfillmentRate />,
  },
  {
    name: "stock-levels",
    path: "/stock-levels",
    element: <StockLevels />,
  },
  {
    name: "low-stock-alerts",
    path: "/low-stock-alerts",
    element: <LowStockAlerts />,
  },
  {
    name: "stock-in-out",
    path: "/stock-in-out",
    element: <StockInOut />,
  },
  {
    name: "legal-documents",
    path: "/legal-documents",
    element: <LegalDocuments />,
  },
  {
    name: "safety-incidents",
    path: "/safety-incidents",
    element: <SafetyIncidentIndex />,
  },
  {
    name: "safety-incidents-view",
    path: "/safety-incidents/:id",
    element: <SafetyIncidentView />,
  },
  {
    name: "compliance-checklists",
    path: "/compliance-checklists",
    element: <ComplianceChecklistIndex />,
  },
  {
    name: "Track Shipment",
    path: "/track-shipment",
    element: <TrackShipment />,
  },
  {
    name: "Shipment History",
    path: "/shipment-history",
    element: <ShipmentHistory />,
  },
  {
    name: "codTabs",
    path: "/cod",
    element: <CODTabs />,
  },
  {
    name: "partnerManagementAccounts",
    path: "/partner-management/accounts",
    element: <PartnersTabs />,
  },
  {
    name: "companies",
    path: "/companies",
    element: <CompanyIndex />,
  },
  {
    name: "requestsFinancial",
    path: "/requestsFinancial",
    element: <FinancialIndex />,
  },
  {
    name: "companyAccounts",
    path: "/companies/accounts/:company_id",
    element: <CompanyAccount />,
  },
  {
    name: "companies",
    path: "/companies/commissions/:company_id",
    element: <CompanyCommission />,
  },
  {
    name: "companies",
    path: "/companies/commissions/:company_id/import",
    element: <CompanyCommissionImport />,
  },
  {
    name: "companyDriversInvoices",
    path: "/companies/invoices/:company_id",
    element: <CompanyDriverInvoices />,
  },
  {
    name: "countryChannels",
    path: "/channels/country/:shipper_id",
    element: <CountryChannel />,
  },
  {
    name: "governorateChannels",
    path: "/channels/governorate/:shipper_id",
    element: <GovernorateChannel />,
  },
  {
    name: "stateChannels",
    path: "/channels/state/:shipper_id",
    element: <StateChannel />,
  },
  {
    name: "notifications",
    path: "notifications",
    element: <Notifications />,
  },
  {
    name: "notifications/test/websockets",
    path: "notifications/test/websockets",
    element: <WebSocketTest />,
  },
  {
    name: "merchantNotifications",
    path: "merchant-notifications",
    element: <MerchantNotifications />,
  },
  {
    name: "driverBonuses",
    path: "bonuses/:driver_id",
    element: <DriverBonus />,
  },
  {
    name: "sorter-stockout",
    path: "/sorter/stockout",
    element: <StockOutSort />,
  },
  {
    name: "stockOUts",
    path: "stock-out",
    element: <StockOutIndex />,
  },
  {
    name: "shelf_shipments",
    path: "shelf-shipments",
    element: <ShelfShipmentsIndex />,
  },
  {
    name: "whatsapp/whatsapp-templates",
    path: "whatsapp/whatsapp-templates",
    element: <WhatsappTemplateIndex />,
  },
  {
    name: "driverAppSetting",
    path: "driver-app-settings",
    element: <DriverAppSetting />,
  },
  {
    name: "zonesMap",
    path: "zones-map",
    element: <Zones />,
  },
  {
    name: "address-updates",
    path: "address-updates",
    element: <AddressUpdates />,
  },
  {
    name: "driver-status",
    path: "driver-status",
    element: <DriverStatus />,
  },
  // Merchant Routes
  {
    name: "scheduled-messages",
    path: "scheduled-messages",
    element: <ScheduledMessages />,
  },
  {
    name: "custom-declarations",
    path: "/custom-declarations",
    element: <CustomDeclarations />,
  },
  {
    name: "shipment-rules-engine",
    path: "/shipment-rules-engine",
    element: <ShipmentRulesEngine />,
  },
  {
    name: "whatsapp-integrations",
    path: "/whatsapp-integrations",
    element: <WhatsappIntegrations />,
  },
  {
    name: "notifications-center",
    path: "/notifications-center",
    element: <NotificationCenter />,
  },
  {
    name: "customer-created-shipments",
    path: "/customer-created-shipments",
    element: <CustomerCreatedShipments />,
  },
  {
    name: "merchant-summary",
    path: "/merchant-summary",
    element: <MerchantSummary />,
  },
  {
    name: "guest-drivers",
    path: "/guest-drivers",
    element: <GuestDrivers />,
  },
  {
    name: "guest-driver-shipments",
    path: "/guest-driver-shipments",
    element: <GuestDriverShipments />,
  },
  {
    name: "guest-customers",
    path: "/guest-customers",
    element: <GuestCustomers />,
  },
  {
    name: "archived-shipments",
    path: "/archived-shipments",
    element: <ArchivedShipments />,
  },
];

export default adminRoutes;
