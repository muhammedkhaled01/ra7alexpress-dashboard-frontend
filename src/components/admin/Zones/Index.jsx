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
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Plus,
  RefreshCcw,
  Trash2Icon,
  Pencil,
  Download,
  Upload,
} from "lucide-react";
import Edit from "./Edit";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";
import Select from "@/components/misc/Select";
import ZoneImportDialog from "./ZoneImportDialog";
import ZoneExportDialog from "./ZoneExportDialog";
import { toast } from "react-hot-toast";

const ZoneIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zones, setZones] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const accessAbility = can("Zone access");
  const createAbility = can("Zone create");
  const updateAbility = can("Zone update");
  const deleteAbility = can("Zone delete");
  const importAbility = can("Zone import");
  const exportAbility = can("Zone export");

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const openViewDialog = (record) => {
    setselectedRecord(record);
    setViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setselectedRecord(null);
    setViewDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchZones(currentPage);
  }, [currentPage, itemsPerPage]);

  const fetchZones = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`zones?page=${pageNumber}&per_page=${itemsPerPage}`);
      setLinks(response.data.data.links || []);
      setZones(response.data.data.data || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`zones?query=${search}&per_page=${itemsPerPage}`);
      setZones(response.data.data.data || []);
      setLinks(response.data.data.links || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.closeTabId) {
      dispatch(closeTab(location.state.closeTabId));
      fetchZones(currentPage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, dispatch]);

  const handleRefresh = () => {
      if(search === "") {
          fetchZones(currentPage);
      }
    setSearch("");
    setRefreshBtn(false);
  };

  const handleSubmitSuccess = () => {
    fetchZones(currentPage);
  };

   useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        setRefreshBtn(true);
        handleSearch();
      } else {
        setRefreshBtn(false);
        fetchZones(currentPage); // 👈 رجع داتا الشحنات العادية
      }
    }, 500);
  
    return () => clearTimeout(timer);
  }, [search, handleSearch, currentPage]);

  const handleImportSuccess = () => {
    fetchZones(currentPage);
  };

  const handleExportSuccess = () => {
    toast.success(t("Export completed successfully"));
  };

  return (
    <div>
      <PageTitle title={t("Routing Rules")} />
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-2">
        <div className="flex flex-col md:flex-row gap-2">
          {createAbility && (
            <Link to={"/routing-rules/create-route-rule"}>
              <Button type="button" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>{t("Create Route Rule")}</span>
              </Button>
            </Link>
          )}
          {importAbility && (
            <Button
              type="button"
              variant="outline"
              className="flex items-center w-fit space-x-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-700"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="w-4 h-4" />
            </Button>
          )}
          {exportAbility && (
            <Button
              type="button"
              variant="outline"
              className="flex items-center w-fit space-x-1 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40 border-green-200 dark:border-green-700"
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
        <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={t("Search Zones...")}
              onChange={(e) => setSearch(e.target.value)}
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
                { value: 5, label: '5' },
                { value: 8, label: '8' },
                { value: 15, label: '15' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 100, label: '100' }
              ]}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
        </form>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t("#")}</TableHead>
              <TableHead isFixed>{t("Name")}</TableHead>
              <TableHead>{t("Governorate")}</TableHead>
              <TableHead>{t("States")}</TableHead>
              <TableHead>{t("Places")}</TableHead>
              <TableHead>{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : zones && zones.length > 0 ? (
              zones.map((zone, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>
                    {zone.name}
                    <div className="flex justify-center gap-x-2 mt-2">
                      {updateAbility && (
                        <Link
                          to={`/routing-rules/edit-routing-rule/${zone.id}`}
                          variant="edit"
                          size="xs"
                        >
                          <Button variant="edit" size="xs">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {deleteAbility && (
                        <Button
                          onClick={() => openDeleteAlert(zone)}
                          type="button"
                          variant="delete"
                          size="xs"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {zone.governorates?.map((governorate, idx) => (
                      <div key={idx}>
                        {`${governorate.en_name} / ${governorate.ar_name}`}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {zone.selected_states?.map((state, idx) => (
                      <div key={idx}>
                        {`${state.en_name} / ${state.ar_name}`}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {zone.assigned_places?.map((place, idx) => (
                      <div key={idx}>
                        {`${place.en_name} / ${place.ar_name}`}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {accessAbility && (
                      <Button
                        onClick={() => openViewDialog(zone)}
                        size="icon"
                        variant="show"
                      >
                        <Eye />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"zones/delete"}
        />
      )}
      {importDialogOpen && (
        <ZoneImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSubmitSuccess={handleImportSuccess}
        />
      )}
      {exportDialogOpen && (
        <ZoneExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          onSubmitSuccess={handleExportSuccess}
          zones={zones}
        />
      )}
    </div>
  );
};

export default ZoneIndex;