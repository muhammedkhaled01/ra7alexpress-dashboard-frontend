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
  Plus,
  RefreshCcw,
  Sheet,
  Trash2Icon,
  Pencil,
} from "lucide-react";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";

const StationIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [stations, setStations] = useState([]);
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
  const accessAbility = can("Station access");
  const createAbility = can("Station create");
  const updateAbility = can("Station update");
  const deleteAbility = can("Station delete");
  const exportAbility = can("Station export");

  const isHubAdmin = hasRole("HubAdmin");

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

  // Edit & Delete & Pagination Logic - End

  const fetchStations = useCallback(async (pageNumber = 1) => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axiosMerchant.get('stations', {
        params: {
          page: pageNumber,
          per_page: itemsPerPage,
          ...(search && { query: search })
        }
      });
      
      if (response.data.data) {
        setStations(response.data.data.data || []);
        setLinks(response.data.data.links || []);
      } else {
        setStations([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
      setStations([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [search, itemsPerPage, accessAbility, navigate]);

  // Initial data fetch
  useEffect(() => {
    fetchStations(currentPage);
  }, [currentPage, fetchStations]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.closeTabId) {
      dispatch(closeTab(location.state.closeTabId));
      window.history.replaceState({}, document.title);
      handleRefresh();
    }
  }, [location.state, dispatch]);

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    setCurrentPage(1);
    setRefreshBtn(true);
    fetchStations(1);
  }, [fetchStations]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchStations(1);
  }, [fetchStations]);

  const handleSubmitSuccess = () => {
    fetchStations(currentPage);
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
      <PageTitle title={t("Stations")} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        {createAbility && (
          <Link to={"/stations/create-station"}>
            <Button type="button" className="flex items-center space-x-1">
              <Plus className="w-4 h-4" />
              <span>{t("Create Station")}</span>
            </Button>
          </Link>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                placeholder={t("Search Stations")}
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
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        ) : stations && stations.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead isFixed>{t("Name")}</TableHead>
                  {!isHubAdmin && <TableHead>{t("Hub")}</TableHead>}
                  <TableHead>{t("Location")}</TableHead>
                  <TableHead>{t("Address")}</TableHead>
                  <TableHead>{t("Accounts")}</TableHead>
                  {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((station, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell isFixed>
                      {station.name}
                      <div className="flex justify-center gap-x-2 mt-2">
                        {updateAbility && (
                          <Link to={`/stations/edit-station/${station.id}`}>
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
                            onClick={() => openDeleteAlert(station)}
                            type="button"
                            variant="delete"
                            size="xs"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{station.hub?.name}</TableCell>
                    <TableCell>{station.location}</TableCell>
                    <TableCell>{station.address}</TableCell>
                    <TableCell>
                      {accessAbility && (
                        <Link to={"/stations/accounts/" + station.id}>
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
                          {updateAbility && (
                            <Link to={`/stations/edit-station/${station.id}`}>
                              <DropdownMenuItem>
                                <EditIcon className="p-1" /> {t("Edit")}
                              </DropdownMenuItem>
                            </Link>
                          )}
                          {deleteAbility && (
                            <DropdownMenuItem
                              onClick={() => openDeleteAlert(station)}
                            >
                              <Trash2Icon className="p-1" /> {t("Delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell> */}
                  </TableRow>
                ))}
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
          api={"stations/delete"}
          message={
            <span>
              <b>{t("All Related data to station will be deleted such as")}</b>
              <ul>
                <li>{t("Shelf related to the station")}</li>
                <li>{t("Zones related to the station")}</li>
                <li>{t("All shipment information in the station zones")}</li>
                <li>{t("All transfer related shipments")}</li>
                <li>{t("All the shipments which are assigned to shelf in the station.")}</li>
              </ul>
            </span>
          }
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
          model="stations"
          endpoint="stations/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "hub.name", label: "Hub" },
            { key: "location", label: "Location" },
            { key: "contact_number", label: "Contact" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default StationIndex;
