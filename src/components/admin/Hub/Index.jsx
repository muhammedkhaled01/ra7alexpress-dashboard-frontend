import axiosMerchant from "@/axios";
import { useCallback, useEffect, useState } from "react";
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
import { Link, useLocation, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  Download,
  EyeIcon,
  Plus,
  RefreshCcw,
  Sheet,
  Trash2Icon,
  Pencil,
} from "lucide-react";
import Edit from "./Edit";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";

const HubIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [hubs, setHubs] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accessAbility = can("Hub access");
  const createAbility = can("Hub create");
  const updateAbility = can("Hub update");
  const deleteAbility = can("Hub delete");
  const exportAbility = can("Hub export");

  // DELETE ALERT
  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const openEditDialog = (record) => {
    setselectedRecord(record);

    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const location = useLocation();
  useEffect(() => {
    if (location.state?.closeTabId) {
      dispatch(closeTab(location.state.closeTabId));
      // Clear the state so it doesnt runagain
      window.history.replaceState(null, document.title);
      handleRefresh();
    }
  }, [location.state, dispatch]);

  // Edit & Delete & Pagination Logic - End

  const fetchHubs = useCallback(async (pageNumber = 1) => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axiosMerchant.get('hubs', {
        params: {
          page: pageNumber,
          per_page: itemsPerPage,
          ...(search && { query: search })
        }
      });
      
      if (response.data.data) {
        setHubs(response.data.data.data || []);
        setLinks(response.data.data.links || []);
      } else {
        setHubs([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
      setHubs([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [search, itemsPerPage, accessAbility, navigate]);

  // Initial data fetch
  useEffect(() => {
    fetchHubs(currentPage);
  }, [currentPage, fetchHubs]);

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    setCurrentPage(1);
    setRefreshBtn(true);
    fetchHubs(1);
  }, [fetchHubs]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchHubs(1);
  }, [fetchHubs]);

  const handleSubmitSuccess = () => {
    fetchHubs(currentPage);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        setRefreshBtn(true);
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  return (
    <div>
      <PageTitle title={t("Hubs")} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        <div className="flex justify-start">
          {createAbility && (
            <Link to={"create-hub"}>
              <Button type="button" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>{t("Create Hub")}</span>
              </Button>
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                placeholder={t("Search Hubs")}
                onChange={(e) => setSearch(e.target.value)}
                icon={
                  refreshBtn && (
                    <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                  )
                }
              />
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
              {exportAbility && (
                <Button type="button" variant="download" onClick={e => setShowExport(true)}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        ) : hubs && hubs.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead isFixed>{t("Name")}</TableHead>
                  <TableHead>{t("Country")}</TableHead>
                  <TableHead>{t("Governorate/State")}</TableHead>
                  <TableHead>{t("Place/City")}</TableHead>
                  <TableHead>{t("Location")}</TableHead>
                  <TableHead>{t("Address")}</TableHead>
                  <TableHead>{t("Accounts")}</TableHead>
                  {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {hubs.map((hub, index) => {
                  const governorate = hub?.governorate
                    ? `${hub?.governorate?.en_name} (${hub?.governorate?.ar_name})`
                    : "";
                  const state = hub?.state
                    ? `${hub?.state?.en_name} (${hub?.state?.ar_name})`
                    : "";
                  const place = hub?.place
                    ? `${hub?.place?.en_name} (${hub?.place?.ar_name})`
                    : "";
                  const city = hub?.city?.name || "";

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell isFixed>
                        {hub.name}
                        <div className="flex justify-center gap-x-2 mt-2">
                          {accessAbility && (
                            <Link to={"view/" + hub.id}>
                              <Button
                                variant="show"
                                size="xs"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                          {updateAbility && (
                            <Link to={"/hubs/edit-hub/" + hub.id}>
                              <Button
                                variant="edit"
                                size="xs"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                          {deleteAbility && (
                            <Button
                              onClick={() => openDeleteAlert(hub)}
                              type="button"
                              variant="delete"
                              size="xs"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{hub?.country?.name}</TableCell>
                      <TableCell>
                        {[governorate, state].filter(Boolean).join(" / ")}
                      </TableCell>
                      <TableCell>
                        {[city, place].filter(Boolean).join(" / ")}
                      </TableCell>
                      <TableCell>{hub.location}</TableCell>
                      <TableCell>{hub.address}</TableCell>
                      <TableCell>
                        {accessAbility && (
                          <Link to={"accounts/" + hub.id}>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => openViewDialog(driver)}
                              className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                            >
                              <Sheet className="h-4 w-4" /> {t("Accounts")}
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                      {/* <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" className="h-10 w-10 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {accessAbility && (
                              <Link to={"view/" + hub.id}>
                                <DropdownMenuItem>
                                  <EyeIcon className="p-1" /> {t("View")}
                                </DropdownMenuItem>
                              </Link>
                            )}
                            {updateAbility && (
                              <Link to={"/hubs/edit-hub/" + hub.id}>
                                <DropdownMenuItem>
                                  <EditIcon className="p-1" /> {t("Edit")}
                                </DropdownMenuItem>
                              </Link>
                            )}
                            {deleteAbility && (
                              <DropdownMenuItem
                                onClick={() => openDeleteAlert(hub)}
                              >
                                <Trash2Icon className="p-1" /> {t("Delete")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell> */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {links.length > 1 && (
              <Pagination
                links={links}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <NoRecordFound />
        )}
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"hubs/delete"}
        />
      )}
      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )}

      {showExport && (
        <ExportDialog
          model="hubs"
          endpoint="hubs/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "location", label: "Location" },
            { key: "country.name", label: "Country" },
            { key: "governorate.en_name", label: "Governorate" },
            { key: "state.en_name", label: "State" },
            { key: "place.en_name", label: "Place" },
            { key: "address", label: "Address" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default HubIndex;
