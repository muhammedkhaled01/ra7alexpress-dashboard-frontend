import axiosMerchant from "@/axios";
import { useEffect, useState, useCallback } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  Plus,
  KeyRound,
  Pencil,
  Trash2Icon,
  User,
  DollarSign,
  Receipt,
  Sheet,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import Edit from "./Edit";
import MerchantSettings from "./MerchantSettings";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";
import { Switch } from "@/components/ui/switch";
import Password from "../Users/Password";
import Select from "@/components/misc/Select";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Badge } from "@/components/ui/badge.jsx";

const MerchantIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState("");
  const [showGuest, setShowGuest] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [pendingMerchant, setPendingMerchant] = useState(null);
  const [pendingChecked, setPendingChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingStatusMerchant, setPendingStatusMerchant] = useState(null);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const language = useLanguage();

  const accessAbility = can("Merchant access");
  const createAbility = can("Merchant create");
  const updateAbility = can("Merchant update");
  const deleteAbility = can("Merchant delete");

  const openDeleteAlert = (record) => {
    setSelectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setSelectedRecord(null);
    setDeleteAlert(false);
  };

  const closeEditDialog = () => {
    setSelectedRecord(null);
    setEditDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const fetchMerchants = useCallback(
    async (pageNumber) => {
      setLoading(true);
      try {
        const response = await axiosMerchant.get(
          `merchants?page=${pageNumber}&per_page=${itemsPerPage}&showGuest=${showGuest}`
        );
        setLinks(response.data.data.links);
        setMerchants(response.data.data.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setLinks, setMerchants, showGuest, itemsPerPage]
  );

  const handleRefresh = useCallback(() => {
    setSearch("");
    fetchMerchants(currentPage);
  }, [setSearch, fetchMerchants, currentPage]);

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchMerchants(currentPage);
  }, [
    currentPage,
    accessAbility,
    navigate,
    fetchMerchants,
    itemsPerPage,
    showGuest,
  ]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`merchants?query=${search}`);
      setMerchants(response.data.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [search, setLoading, setMerchants, setLinks]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.closeTabId) {
      dispatch(closeTab(location.state.closeTabId));
      // Clear the state so it doesnt run again
      window.history.replaceState(null, document.title);
      handleRefresh();
    }
  }, [location.state, dispatch, handleRefresh]); // أضفت handleRefresh كـ dependency

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  useEffect(() => {
    if (location.state?.from === "/merchants/create-merchant") {
      handleRefresh();
    }
  }, [location, handleRefresh]);

  const handleSubmitSuccess = () => {
    fetchMerchants(currentPage);
  };

  const handleToggleClick = (merchant) => {
    setPendingMerchant(merchant);
    setPendingChecked(
      merchant?.merchant?.settings?.created_shipment_notification === 1
    );
    setIsModalOpen(true);
  };

  const confirmToggleCreatedShipmentNotification = async () => {
    setLoading(true);
    try {
      await axiosMerchant.post(
        `merchant_settings/${pendingMerchant.id}/toggle-created-shipment-notification`,
        {
          merchant_id: pendingMerchant.id,
          created_shipment_notification: pendingChecked ? 0 : 1,
        }
      );
      fetchMerchants(currentPage);
    } catch (error) {
      handleError(error);
    } finally {
      setIsModalOpen(false);
      setLoading(false);
    }
  };

  const handleToggleMerchantStatusClick = (merchant) => {
    setPendingStatusMerchant(merchant);
    setIsStatusModalOpen(true);
  };

  const toggleActiveMerchant = async () => {
    if (!pendingStatusMerchant) return;
    setLoading(true);
    const newStatus =
      pendingStatusMerchant.status === "active" ? "inactive" : "active";
    try {
      await axiosMerchant.post(
        `merchants/${pendingStatusMerchant.id}/toggle-active-status`,
        {
          status: newStatus,
        }
      );
      await fetchMerchants(currentPage);
    } catch (error) {
      handleError(error);
    } finally {
      setIsStatusModalOpen(false);
      setPendingStatusMerchant(null);
      setLoading(false);
    }
  };

  const openPasswordDialog = (record) => {
    setSelectedRecord(record);
    setPasswordDialog(true);
  };

  const closePasswordDialog = () => {
    setSelectedRecord(null);
    setPasswordDialog(false);
  };

  const toggleShowMerchants = useCallback(() => {
    setShowGuest(!showGuest);
  }, [showGuest]);

  return (
    <div>
      <PageTitle title={t("Merchants")} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        <div className="flex gap-3 justify-start">
          {createAbility && (
            <Link to={"/merchants/create-merchant"}>
              <Button type="button" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>{t("Create Merchant")}</span>
              </Button>
            </Link>
          )}
          <MerchantSettings />
          <div className="flex gap-2 items-center">
            <Checkbox
              checked={showGuest}
              onCheckedChange={toggleShowMerchants}
              className="h-4 w-4"
              aria-label="Select all shipments"
            />
            <span className="ml-2">{t("Show Only Guest Merchants.")}</span>
          </div>
        </div>

        <form
          className="flex md:items-center flex-col md:flex-row gap-2"
          onSubmit={handleSearch}
        >
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-full md:w-[200px]"
              value={search}
              placeholder={t("Search Merchants...")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                search.trim() !== "" && (
                  <RefreshCcw
                    className="w-4 h-4 cursor-pointer"
                    onClick={handleRefresh}
                  />
                )
              }
            />
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <Select
              value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
              onChange={(selectedOption) => {
                setItemsPerPage(Number(selectedOption.value));
              }}
              options={[
                { value: 5, label: "5" },
                { value: 8, label: "8" },
                { value: 15, label: "15" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
        </form>
      </div>
      {/* <View /> */}
      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead>#</TableHead> */}
              <TableHead isFixed>{t("Name")}</TableHead>
              <TableHead isFixed>{t("Username")}</TableHead>
              <TableHead>{t("Profile")}</TableHead>
              {/* <TableHead>{t("Contact Number")}</TableHead> */}
              {/* <TableHead>{t("Currency")}</TableHead> */}
              <TableHead>{t("Address")}</TableHead>
              <TableHead>{t("Created Shipment Notification")}</TableHead>
              <TableHead>{t("Is Active")}</TableHead>
              <TableHead>{t("Financials")}</TableHead>
              {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : merchants.length > 0 ? (
              merchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  {/* <TableCell>{index + 1}</TableCell> */}
                  <TableCell isFixed>
                    {merchant.name}
                    <div className="flex gap-x-2 mt-2 justify-center">
                      {updateAbility && (
                        <Link to={`/merchants/edit-merchant/${merchant.id}`}>
                          <Button variant="edit" size="xs">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {updateAbility && (
                        <Button
                          onClick={() => openPasswordDialog(merchant)}
                          variant="password"
                          size="xs"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                      )}
                      {deleteAbility && (
                        <Button
                          onClick={() => openDeleteAlert(merchant)}
                          variant="delete"
                          size="xs"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{merchant.username}</TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-2">
                      <div>
                        <b>{t("Email")}: </b>
                        {merchant.email}
                      </div>
                      <div>
                        <b>{t("Contact Number")}: </b>
                        {String(merchant.merchant?.country_code ?? "") +
                          String(merchant.merchant?.contact_no ?? "")}
                      </div>
                      <div>
                        <Link to={`${merchant.id}/view`}>
                          <Button
                            variant="outline"
                            size="xs"
                            className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                          >
                            <User className="h-4 w-4" /> {t("View Profile")}
                          </Button>
                          <br />
                          {merchant?.merchant?.is_guest ? (
                            <Badge
                              variant="delivered"
                              className="cursor-pointer mt-2"
                            >
                              {t("Guest Merchant")}
                            </Badge>
                          ) : null}
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {merchant?.merchant?.governorate && (
                      <>
                        <b>{t("Governorate: ")}</b>
                        {language === "en"
                          ? merchant?.merchant?.governorate?.en_name
                          : merchant?.merchant?.governorate?.ar_name}
                        <br />
                      </>
                    )}
                    {merchant?.merchant?.state && (
                      <>
                        <b>{t("State: ")}</b>
                        {language === "en"
                          ? merchant?.merchant?.state?.en_name
                          : merchant?.merchant?.state?.ar_name}
                        <br />
                      </>
                    )}
                    {merchant?.merchant?.place && (
                      <>
                        <b>{t("Place: ")}</b>
                        {language === "en"
                          ? merchant?.merchant?.place?.en_name
                          : merchant?.merchant?.place?.ar_name}
                        <br />
                      </>
                    )}
                    {merchant?.merchant?.address && (
                      <>
                        <b>{t("Address")}: </b>
                        {language === "en"
                          ? merchant?.merchant?.address
                          : merchant?.merchant?.address}
                        <br />
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-middle justify-center  gap-x-2">
                      <Switch
                        id={`created-shipment-notification-${merchant.id}`}
                        checked={
                          merchant?.merchant?.settings
                            ?.created_shipment_notification === 1
                        }
                        onCheckedChange={() => handleToggleClick(merchant)}
                      />
                      {/* <label htmlFor={`payment-proof-${merchant.id}`}>
                        {t("Created Shipment Notification")}
                      </label> */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-middle justify-center  gap-x-2">
                      <Switch
                        id={`created-status-${merchant.id}`}
                        checked={merchant?.status === "active"}
                        onCheckedChange={() =>
                          handleToggleMerchantStatusClick(merchant)
                        }
                      />
                    </div>
                  </TableCell>
                  <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                  >
                    <ModalHeader>
                      <ModalTitle>
                        {t("Confirm Created Shipment Notification Change")}
                      </ModalTitle>
                    </ModalHeader>
                    <ModalContent>
                      <bdi>
                        {t("Are you sure you want to")}
                        {pendingChecked ? t("disable") : t("enable")}{" "}
                        {t("the created shipment notification for")}
                        <b>{pendingMerchant?.name}</b>
                        {language === "en" ? "?" : "؟"}
                      </bdi>
                    </ModalContent>
                    <ModalFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                      >
                        {t("Cancel")}
                      </Button>
                      <Button
                        onClick={confirmToggleCreatedShipmentNotification}
                        disabled={loading}
                      >
                        {loading ? t("Saving...") : t("Confirm")}
                      </Button>
                    </ModalFooter>
                  </Modal>
                  <Modal
                    isOpen={isStatusModalOpen}
                    onClose={() => setIsStatusModalOpen(false)}
                  >
                    <ModalHeader>
                      <ModalTitle>
                        {t("Confirm Merchant Status Change")}
                      </ModalTitle>
                    </ModalHeader>
                    <ModalContent>
                      {pendingStatusMerchant && (
                        <bdi>
                          {t("Are you sure you want to")}
                          {pendingStatusMerchant.status === "active"
                            ? t("disable")
                            : t("enable")}{" "}
                          {t("the status for ")}
                          <b>{pendingStatusMerchant?.name}</b>
                          {language === "en" ? "?" : "؟"}
                        </bdi>
                      )}
                    </ModalContent>
                    <ModalFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsStatusModalOpen(false)}
                      >
                        {t("Cancel")}
                      </Button>
                      <Button onClick={toggleActiveMerchant} disabled={loading}>
                        {loading ? t("Saving...") : t("Confirm")}
                      </Button>
                    </ModalFooter>
                  </Modal>

                  <TableCell>
                    <div className="grid [grid-template-columns:auto_auto] space-y-2">
                      <Link to={"commissions/" + merchant.id}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <DollarSign className="h-4 w-4" /> {t("Commissions")}
                        </Button>
                      </Link>
                      <Link to={"accounts/" + merchant.id}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Sheet className="h-4 w-4" /> {t("Accounts")}
                        </Button>
                      </Link>
                      <Link to={`/merchants/wallet/${merchant?.id}`}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Wallet className="h-4 w-4" /> {t("Wallet")}
                        </Button>
                      </Link>
                      <Link to={"invoices/" + merchant.id}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Receipt className="h-4 w-4" /> {t("Invoices")}
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                  {/* <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {accessAbility && (
                          <DropdownMenuItem
                            onClick={() => navigate(`/merchants/${merchant.id}/view`)}
                          >
                            <User className="mr-2 h-4 w-4" /> {t("View Profile")}
                          </DropdownMenuItem>
                        )} */}
                  {/* {updateAbility && (
                            <Link to={`/merchants/edit-merchant/${merchant.id}`}>
                              <DropdownMenuItem>
                                <EditIcon className="mr-2 h-4 w-4" /> {t("Edit")}
                              </DropdownMenuItem>
                            </Link>
                          )} */}
                  {/* {deleteAbility && (
                            <DropdownMenuItem
                              onClick={() => openDeleteAlert(merchant)}
                            >
                              <Trash2Icon className="mr-2 h-4 w-4" />{" "}
                              {t("Delete")}
                            </DropdownMenuItem>
                          )} */}
                  {/* </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination links={links} onPageChange={handlePageChange} />
      </div>

      {editDialogOpen && (
        <Edit
          record={selectedRecord}
          isOpen={editDialogOpen}
          onClose={closeEditDialog}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"merchants/delete"}
        />
      )}

      {passwordDialog && (
        <Password
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closePasswordDialog}
        />
      )}
    </div>
  );
};

export default MerchantIndex;
