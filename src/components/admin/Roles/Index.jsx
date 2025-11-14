import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  Download,
  EditIcon,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Trash2Icon,
  Pencil,
  Upload,
} from "lucide-react";
import { can, handleError, generateTabId } from "@/utils/helpers";
import DeleteAlert from "@/components/misc/DeleteAlert";
import Loader from "@/components/Loader";
import { useTranslation } from "react-i18next";
import View from "./View";
import ExportDialog from "@/components/misc/ExportDialog";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";
import RoleImportDialog from "./RoleImportDialog";
import Select from "@/components/misc/Select";

const RoleIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Role access");
  const createAbility = can("Role create");
  const updateAbility = can("Role update");
  const deleteAbility = can("Role delete");
  const exportAbility = can("Role export");
  const handleImportSuccess = () => {
    fetchRoles(currentPage);
    toast.success(t("Roles imported successfully"));
  };
  const importAbility = can("Role import");

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }

    fetchRoles(currentPage);
  }, [currentPage, itemsPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const fetchRoles = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`roles?page=${pageNumber}&per_page=${itemsPerPage}`);
      setLinks(response.data.data.links);
      setRoles(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // DELETE ALERT
  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const handleSearch = async (e) => {
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`roles?query=${search}`);
      setRoles(response.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (location.state?.closeTabId) {
      dispatch(closeTab(location.state.closeTabId));
      // Clear the state so it doesnt runagain
      window.history.replaceState(null, document.title);
      handleRefresh();
    }
  }, [location.state, dispatch]);

  useEffect(() => {
    if (location.state?.from === '/roles/create-role') {
      handleRefresh();
    }
  }, [location])
  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchRoles();
  };

  const handleSubmitSuccess = () => {
    fetchRoles();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false)
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <PageTitle title={t("Roles")} />
      <div className="flex flex-wrap justify-between gap-3 mt-2">
        <div>
          <div>
            {createAbility && (
              <Link to={"create-role"}>
                <Button type="button" className="flex items-center space-x-1">
                  <Plus className="w-4 h-4" />
                  <span>{t("Create Role")}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={t("Search By Name...")}
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
              <Button variant="download" type="button" onClick={e => setShowExport(true)}>
                <Download />
              </Button>
            )}
            {importAbility && (
              <Button
                type="button"
                variant="outline"
                className="flex items-center space-x-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                onClick={() => setShowImport(true)}
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}
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
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead isFixed>{t("Name")}</TableHead>
              <TableHead>{t("Permissions")}</TableHead>
              {/* <TableHead className="text-right">{t("Action")}</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : roles && roles.length > 0 ? (
              roles?.map((role, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>
                    {role.name}
                    <div className="flex justify-center gap-x-2 mt-2">
                      {accessAbility && (
                        <Button
                          variant="show"
                          size="xs"
                          onClick={() => {
                            setselectedRecord(role);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {updateAbility && (
                        <Link to={`/roles/edit-role/${role.id}`}>
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
                          onClick={() => openDeleteAlert(role)}
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
                    {role?.permissions?.slice(0, 2).map((permission, index) => (
                      <Badge key={index} style={{ margin: "2px 2px" }}>
                        {permission.name}
                      </Badge>
                    ))}
                    {role?.permissions?.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setselectedRecord(role);
                          setViewDialogOpen(true);
                        }}
                        className="text-sm"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        {t("Show all")} ({role?.permissions?.length - 2}+)
                      </Button>
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
                        <DropdownMenuItem
                          onClick={() => {
                            setselectedRecord(role);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="p-1" /> {t("Show")}
                        </DropdownMenuItem>
                        {updateAbility && (
                          <Link to={`/roles/edit-role/${role.id}`}>
                            <DropdownMenuItem>
                              <EditIcon className="p-1" /> {t("Edit")}
                            </DropdownMenuItem>
                          </Link>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(role)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell> */}
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
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {viewDialogOpen && (
        <View
          record={selectedRecord}
          onClose={() => {
            setViewDialogOpen(false);
            setselectedRecord(null);
          }}
        />
      )}
      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"roles/delete"}
        />
      )}

      {showExport && (
        <ExportDialog
          model="roles"
          endpoint="roles/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
      {showImport && (
        <RoleImportDialog
          open={showImport}
          onClose={() => setShowImport(false)}
          onSubmitSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
};

export default RoleIndex;
