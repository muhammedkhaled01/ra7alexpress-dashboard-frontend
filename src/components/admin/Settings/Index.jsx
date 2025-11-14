import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import {
  Table,
  TableBody,
  TableCaption,
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
import { Link, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  EditIcon,
  Filter,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import {
  can,
  convertBoolean,
  handleError,
  humanizeText,
} from "@/utils/helpers";
import DeleteAlert from "@/components/misc/DeleteAlert";
import Loader from "@/components/Loader";
import Status from "./Status";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";

const SettingIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();

  const accessAbility = can("Setting access");
  const createAbility = can("Setting create");
  const updateAbility = can("Setting update");
  const deleteAbility = can("Setting delete");

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }

    fetchSettings(currentPage);
  }, [currentPage, itemsPerPage]);

  // DIALOG STATUS
  const openStatusDialog = (record) => {
    setselectedRecord(record);

    setStatusDialog(true);
  };

  const closeStatusDialog = () => {
    setselectedRecord(null);
    setStatusDialog(false);
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

  const openEditDialog = (record) => {
    setselectedRecord(record);

    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const closeViewDialog = () => {
    setselectedRecord(null);
    setViewDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End

  // useEffect(() => {
  //   fetchSettings(currentPage);
  //   axiosMerchant.get(`api/company/settings/get/update`).then(res => {

  //   })
  // }, [currentPage]);

  const fetchSettings = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`settings?page=${pageNumber}&per_page=${itemsPerPage}`);
      setLinks(response.data.data.links || []);
      setSettings(response.data.data.data || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  const { t } = useTranslation();
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (search.trim() === "") return;
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`settings?query=${search}&per_page=${itemsPerPage}`);
      setSettings(response.data.data.data || []);
      setLinks(response.data.data.links || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshBtn(false);
    fetchSettings();
    setSearch("");
  };

  const handleSubmitSuccess = () => {
    fetchSettings(currentPage);
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
      <PageTitle title="Dashboard Configurations" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mt-2">
        <div className="flex flex-wrap gap-3">
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <form className="flex flex-col md:flex-row gap-2" onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={t("Search settings...")}
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

      <div className="shadow-md py-4 mt-2 rounded-lg overflow-x-auto">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        ) : settings && settings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">#</TableHead>
                <TableHead isFixed>{t("Action Name")}</TableHead>
                <TableHead>{t("Target Status")}</TableHead>
                <TableHead>{t("Is Active")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>{humanizeText(setting.key)}</TableCell>
                  <TableCell>{setting.value}</TableCell>
                  <TableCell onClick={() => updateAbility && openStatusDialog(setting)}>
                    <Badge style={{ margin: "2px 2px" }}>
                      {setting.status == "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {updateAbility && (
                      <Button
                        variant="edit"
                        onClick={() => openEditDialog(setting)}
                      >
                        <Pencil /> 
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
      {links.length > 0 && (
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      {statusDialog && (
        <Status
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeStatusDialog}
        />
      )}

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api="api/company/settings/delete"
        />
      )}

      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )}
    </div>
  );

  //     <ul>
  //       {Settings && Settings.map((setting, index) => (
  //         <li key={index}><h3>{setting.name}</h3></li>
  //       ))}

  //     </ul>
  //   </div>
  // )
};

export default SettingIndex;
