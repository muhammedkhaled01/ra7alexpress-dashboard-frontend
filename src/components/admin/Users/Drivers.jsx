import axiosMerchant from "@/axios";
import React, { useCallback, useEffect, useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";

import {
  DollarSign,
  Download,
  EditIcon,
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  Plus,
  Receipt,
  RefreshCcw,
  Sheet,
  Trash2Icon,
  Lock,
  Pencil,
  KeyRound,
} from "lucide-react";
import Edit from "./DriverEdit";
import Password from "./Password";
import View from "./View";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";
import DriverSettings from "./DriverSettings";
import Select from "@/components/misc/Select";

const DriversIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);

  const accessAbility = can("Drivers access");
  const createAbility = can("Drivers create");
  const updateAbility = can("Drivers update");
  const deleteAbility = can("Drivers delete");
  const exportAbility = can("Drivers export");

  const isSuperAdmin = hasRole("Super Admin");
  const isBranchAdmin = hasRole("BranchAdmin");
  const isStationAdmin = hasRole("StationAdmin");
  const isHubAdmin = hasRole("HubAdmin");

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const openViewDialog = (record) => {
    setselectedRecord(record);
    setViewDialogOpen(true);
  };

  const openEditDialog = (record) => {
    setselectedRecord(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const openPasswordDialog = (record) => {
    setselectedRecord(record);
    setPasswordDialog(true);
  };

  const closePasswordDialog = () => {
    setselectedRecord(null);
    setPasswordDialog(false);
  };

  const closeViewDialog = () => {
    setselectedRecord(null);
    setViewDialogOpen(false);
  };
  // فوق مع باقي الhandlers
  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const fetchDrivers = useCallback(
    async (pageNumber = 1, searchQuery = "") => {
      setLoading(true);
      setRefreshBtn(searchQuery.trim() !== "");
      try {
        const response = await axiosMerchant.get(`drivers`, {
          params: {
            page: pageNumber,
            per_page: itemsPerPage,
            query: searchQuery || undefined,
          },
        });

        if (response.data.data) {
          setDrivers(response.data.data.data || []);
          setLinks(response.data.data.links || []);
        } else {
          setDrivers([]);
          setLinks([]);
        }
      } catch (error) {
        handleError(error);
        setDrivers([]);
        setLinks([]);
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, handleError]
  );

  useEffect(() => {
    const isInitialLoad =
      currentPage === 1 && itemsPerPage === 8 && search.trim() === "";
    const timer = setTimeout(
      () => {
        fetchDrivers(currentPage, search);
      },
      isInitialLoad ? 0 : 500
    );

    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, search, fetchDrivers]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.closeTabId) {
      dispatch(closeTab(location.state.closeTabId));
      window.history.replaceState({}, document.title);
      handleRefresh();
    }
  }, [location]);

  const handleRefresh = () => {
    if (search === "") {
      fetchDrivers();
    }
    setSearch("");
    setCurrentPage(1);
    setItemsPerPage(8);
  };

  const handleSubmitSuccess = () => {
    fetchDrivers(currentPage, search);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (driver, checked) => {
    setLoading(true);
    const updatedValue = checked ? "active" : "inactive";
    try {
      await axiosMerchant.post(`drivers/change_status/${driver?.id}`, {
        status: updatedValue,
      });
      fetchDrivers(currentPage, search);
      toast.success("Status updated successfully.");
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEditProof = async (driver, checked) => {
    if (!updateAbility) {
      toast.error(t("You don't have permission to update drivers"));
      return;
    }
    setLoading(true);
    const updatedValue = checked ? 1 : 0;
    try {
      await axiosMerchant.post(`drivers/change_edit_proof/${driver?.id}`, {
        status: updatedValue,
      });
      fetchDrivers(currentPage, search);
      toast.success("Ability updated successfully.");
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const canAccess = can("Drivers access");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <PageTitle title="Drivers" />
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-2">
        <div className="flex gap-x-2">
          {createAbility && (
            <Link to={"/users/create-driver"}>
              <Button type="button" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>{t("Create Driver")}</span>
              </Button>
            </Link>
          )}
          <DriverSettings />
        </div>
        <div className="flex gap-2">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                placeholder={t("Search Drivers...")}
                onChange={handleSearch}
                icon={
                  refreshBtn && (
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
          </form>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                {t("Show")}
              </label>
              <Select
                value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
                onChange={(selectedOption) => {
                  setItemsPerPage(Number(selectedOption.value));
                  setCurrentPage(1);
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
            {exportAbility && (
              <Button
                variant="download"
                type="button"
                onClick={(e) => setShowExport(true)}
              >
                <Download />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead isFixed>{t("Name")}</TableHead>
              <TableHead isFixed>{t("Username")}</TableHead>
              <TableHead>{t("Email")}</TableHead>
              <TableHead>{t("Phone")}</TableHead>
              <TableHead>{t("Company")}</TableHead>
              <TableHead>{t("View")}</TableHead>
              <TableHead>{t("Financials")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : drivers && drivers.length > 0 ? (
              drivers.map((driver, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>
                    {driver?.name}
                    <div className="flex justify-center gap-x-2 mt-2">
                      {updateAbility && (
                        <Button
                          onClick={() => openEditDialog(driver)}
                          variant="edit"
                          size="xs"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {updateAbility && (
                        <Button
                          onClick={() => openPasswordDialog(driver)}
                          size="xs"
                          variant="password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                      )}
                      {deleteAbility && (
                        <Button
                          onClick={() => openDeleteAlert(driver)}
                          type="button"
                          variant="delete"
                          size="xs"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{driver?.username}</TableCell>
                  <TableCell>{driver?.email}</TableCell>
                  <TableCell>
                    {String(driver?.driver?.country_code ?? "") +
                      driver?.driver?.phone}
                  </TableCell>
                  <TableCell>{driver?.driver?.company?.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => openViewDialog(driver)}
                      className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                    >
                      <EyeIcon></EyeIcon>{" "}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-y-2">
                      <Link to={`/bonuses/${driver?.id}`}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <DollarSign className="h-4 w-4" /> {t("Bonuses")}
                        </Button>
                      </Link>
                      <Link to={"accounts/" + driver?.id}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Sheet className="h-4 w-4" /> {t("Accounts")}
                        </Button>
                      </Link>
                      <p>
                        <Button
                          onClick={() =>
                            navigate("/salary-bill-management", {
                              state: { driver_id: driver?.id },
                            })
                          }
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Receipt className="h-4 w-4" /> {t("Invoices")}
                        </Button>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-row">
                      <strong>{t("Edit Proofs")}: </strong>&nbsp;&nbsp;&nbsp;
                      {updateAbility ? (
                        <Switch
                          id={`edit-proofs-${driver?.id}`}
                          checked={driver?.driver?.settings?.edit_proof === 1}
                          onCheckedChange={(checked) =>
                            handleToggleEditProof(driver, checked)
                          }
                        />
                      ) : (
                        <span className="text-muted-foreground">
                          {driver?.driver?.settings?.edit_proof === 1 ? t("Yes") : t("No")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {links.length > 1 && (
          <Pagination
            links={links}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {viewDialogOpen && (
        <View record={selectedRecord} onClose={closeViewDialog} />
      )}

      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )}

      {passwordDialog && (
        <Password
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closePasswordDialog}
        />
      )}

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"drivers/delete"}
        />
      )}

      {showExport && (
        <ExportDialog
          model="drivers"
          endpoint="drivers/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "driver?.phone", label: "Phone" },
            { key: "driver?.company.name", label: "Company" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default DriversIndex;
