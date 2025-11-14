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
import { toast } from "react-hot-toast";
import {
  EditIcon,
  Eye,
  EyeIcon,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Trash2Icon,
  Pencil,
  Lock,
  KeyRound,
  Download,
  Upload,
} from "lucide-react";
import Edit from "./UserEdit";
import Create from "./Create";
import Password from "./Password";
import View from "./View";
import DeleteAlert from "@/components/misc/DeleteAlert";
import {
  can,
  getOwnership,
  handleError,
  hasRole,
  isAuthorized,
  generateTabId,
} from "@/utils/helpers";
import Loader from "@/components/Loader";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";
import Select from "@/components/misc/Select";

// إضافة مكونات الاستيراد والتصدير
import UserImportDialog from "./UserImportDialog";
import UserExportDialog from "./UserExportDialog";

const UserIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false); // حالة استيراد
  const [exportDialogOpen, setExportDialogOpen] = useState(false); // حالة تصدير

  const accessAbility = can("User access");
  const createAbility = can("User create");
  const updateAbility = can("User update");
  const deleteAbility = can("User delete");
  const importAbility = can("User import"); // صلاحية الاستيراد
  const exportAbility = can("User export"); // صلاحية التصدير

  const isSuperAdmin = hasRole("Super Admin");
  const isBranchAdmin = hasRole("Branch Admin");
  const isStationAdmin = hasRole("Station Admin");
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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

  const fetchUsers = useCallback(async (page, perPage, query = "") => {
    setLoading(true);
    setRefreshBtn(query.trim() !== "");
    try {
      const response = await axiosMerchant.get(`users`, {
        params: {
          page: page,
          per_page: perPage,
          query: query || undefined,
        },
      });
      setLinks(response.data.data.links || []);
      setUsers(response.data.data.data || []);
    } catch (error) {
      handleError(error);
      setUsers([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage, itemsPerPage, search);
  }, [currentPage, itemsPerPage, search, fetchUsers]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.closeTabId) {
      dispatch(closeTab(location.state.closeTabId));
      window.history.replaceState({}, document.title);
      fetchUsers(currentPage, itemsPerPage, search);
    }
  }, [location.state, dispatch, fetchUsers, currentPage, itemsPerPage, search]);

  const handleRefresh = () => {
    if (search === "") {
      fetchUsers(1, 8, "");
    }
    setSearch("");
    setCurrentPage(1);
    setItemsPerPage(8);
    // Fetch data immediately after resetting the state
  };

  const handleSubmitSuccess = () => {
    fetchUsers(currentPage, itemsPerPage, search);
  };

  const navigate = useNavigate();

  const canAccess = can("User access");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  const handleImportSuccess = () => {
    fetchUsers(currentPage, itemsPerPage, search);
  };

  const handleExportSuccess = () => {
    toast.success(t("Export completed successfully"));
  };

  return (
    <div>
      <PageTitle title={t("Users")} />
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-2">
        <div className="flex flex-col md:flex-row gap-2">
          {createAbility && (
            <Link to={"/users/create-user"}>
              <Button type="button" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>{t("Create User")}</span>
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
          {createAbility &&
            isSuperAdmin &&
            !isHubAdmin &&
            !isBranchAdmin &&
            !isStationAdmin && (
              <Link to={"/create-hub-admin"}>
                <Button
                  variant="secondary"
                  type="button"
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("Create Hub Admin")}</span>
                </Button>
              </Link>
            )}
          {createAbility &&
            (isSuperAdmin || isHubAdmin) &&
            !isBranchAdmin &&
            !isStationAdmin && (
              <Link to={"/create-station-admin"}>
                <Button
                  variant="secondary"
                  type="button"
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("Create Station Admin")}</span>
                </Button>
              </Link>
            )}
          {createAbility && !isBranchAdmin && (
            <Link to={"/create-branch-admin"}>
              <Button
                variant="secondary"
                type="button"
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>{t("Create Branch Admin")}</span>
              </Button>
            </Link>
          )}
        </div>
        <form
          className="flex md:items-center flex-col md:flex-row gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={t("Search Users...")}
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

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t("#")}</TableHead>
              <TableHead isFixed>{t("Name")}</TableHead>
              <TableHead isFixed>{t("Username")}</TableHead>
              {isSuperAdmin && <TableHead>{t("Owner")}</TableHead>}
              <TableHead>{t("Email")}</TableHead>
              <TableHead>{t("Phone")}</TableHead>
              <TableHead>{t("Role")}</TableHead>
              <TableHead>{t("View")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : users && users.length > 0 ? (
              users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>
                    {user.name}
                    <div className="flex justify-center gap-x-2 mt-2">
                      {updateAbility &&
                        !user.roles.some(
                          (role) => role.name === "Super Admin"
                        ) && (
                          <Link to={`/users/edit/${user.id}`}>
                            <Button variant="edit" size="xs">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      {updateAbility &&
                        !user.roles.some(
                          (role) => role.name === "Super Admin"
                        ) && (
                          <Button
                            onClick={() => openPasswordDialog(user)}
                            variant="password"
                            size="xs"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        )}
                      {deleteAbility &&
                        !user.roles.some(
                          (role) => role.name === "Super Admin"
                        ) && (
                          <Button
                            onClick={() => openDeleteAlert(user)}
                            type="button"
                            variant="delete"
                            size="xs"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  {isSuperAdmin && (
                    <TableCell className="flex justify-center gap-1 flex-wrap">
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {getOwnership(user)}
                      </Badge>
                    </TableCell>
                  )}

                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {String(user?.country_code ?? "") + user?.phone}
                  </TableCell>
                  <TableCell>{user.roles[0]?.name}</TableCell>
                  <TableCell>
                    {accessAbility && (
                      <Button
                        onClick={() => openViewDialog(user)}
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
          api={"users/delete"}
        />
      )}

      {importDialogOpen && (
        <UserImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSubmitSuccess={handleImportSuccess}
        />
      )}

      {exportDialogOpen && (
        <UserExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          onSubmitSuccess={handleExportSuccess}
          users={users}
        />
      )}
    </div>
  );
};

export default UserIndex;
