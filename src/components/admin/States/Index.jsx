import axiosMerchant from "@/axios";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import Select from "../../misc/Select";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ImportDialog from "@/components/misc/ImportDialog";
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
import {
  Download,
  EditIcon,
  EyeIcon,
  Filter,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";

import { useLanguage } from "@/contexts/LanguageProvider";

const StateIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [states, setStates] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const accessAbility = can("State access");
  const createAbility = can("State create");
  const updateAbility = can("State update");
  const deleteAbility = can("State delete");
  const exportAbility = can("State export");
  const importAbility = can("State import");
  const [showImport, setShowImport] = useState(false);
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

  const fetchStates = useCallback(
    async (pageNumber = 1) => {
      if (!accessAbility) {
        navigate("/unauthorized");
        return;
      }

      setLoading(true);
      try {
        const response = await axiosMerchant.get("states/index", {
          params: {
            page: pageNumber,
            per_page: itemsPerPage,
            ...(search && { query: search }),
          },
        });

        if (response.data.data) {
          setStates(response.data.data.data || []);
          setLinks(response.data.data.links || []);
        } else {
          setStates([]);
          setLinks([]);
        }
      } catch (error) {
        handleError(error);
        setStates([]);
        setLinks([]);
      } finally {
        setLoading(false);
      }
    },
    [search, itemsPerPage, accessAbility, navigate]
  );

  // Initial data fetch
  useEffect(() => {
    fetchStates(currentPage);
  }, [currentPage, fetchStates]);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    setRefreshBtn(true);
    fetchStates(1);
  }, [fetchStates]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchStates(1);
  }, [fetchStates]);

  const handleSubmitSuccess = () => {
    fetchStates(currentPage);
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
      <PageTitle title={t("States")} />
      <div className="flex flex-wrap gap-3 mt-2 justify-between">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                placeholder={t("Search States")}
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
          </form>
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
            <div>
              <Button
                type="button"
                variant="download"
                onClick={() => setShowExport(true)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
          {importAbility && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  window.open(
                    `${import.meta.env.VITE_API_BASE_URL}/states/template`,
                    "_blank"
                  )
                }
              >
                Template
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowImport(true)}
              >
                Import
              </Button>
            </div>
          )}
            {/* <Button
              type="button"
              variant="download"
              onClick={() => setShowExport(true)}
            >
              <Download className="w-4 h-4" />
            </Button> */}
          </div>
        </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : states && states.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead isFixed>{t("Name")}(en/ar)</TableHead>
                  <TableHead>{t("governorate")}</TableHead>
                  <TableHead>{t("Country")}</TableHead>
                  {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {states.map((state, index) => (
                  <TableRow key={index}>
                    <TableCell isFixed>
                      {language === "en" ? state.en_name : state.ar_name}
                      <div className="flex justify-center gap-x-2 mt-2">
                        {updateAbility && (
                          <Button
                            onClick={() => openEditDialog(state)}
                            variant="edit"
                            size="xs"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {deleteAbility && (
                          <Button
                            onClick={() => openDeleteAlert(state)}
                            variant="delete"
                            size="xs"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{state.governorate?.en_name}</TableCell>
                    <TableCell>{state.country?.name}</TableCell>
                    {/* <TableCell className="text-right"> */}
                    {/* <DropdownMenu> */}
                    {/* <DropdownMenuTrigger asChild> */}
                    {/* <Button variant="secondary" className="h-10 w-10 p-0"> */}
                    {/* <span className="sr-only">Open menu</span> */}
                    {/* <MoreHorizontal className="h-4 w-4" /> */}
                    {/* </Button> */}
                    {/* </DropdownMenuTrigger> */}
                    {/* <DropdownMenuContent align="end"> */}
                    {/* <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel> */}
                    {/* <DropdownMenuSeparator /> */}
                    {/* {updateAbility && ( */}
                    {/* <DropdownMenuItem */}
                    {/* onClick={() => openEditDialog(state)} */}
                    {/* > */}
                    {/* <EditIcon className="p-1" /> {t("Edit")} */}
                    {/* </DropdownMenuItem> */}
                    {/* )} */}
                    {/* {deleteAbility && ( */}
                    {/* <DropdownMenuItem */}
                    {/* onClick={() => openDeleteAlert(state)} */}
                    {/* > */}
                    {/* <Trash2Icon className="p-1" /> {t("Delete")} */}
                    {/* </DropdownMenuItem> */}
                    {/* )} */}
                    {/* </DropdownMenuContent> */}
                    {/* </DropdownMenu> */}
                    {/* </TableCell> */}
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
          api={"states/delete"}
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
          model="states"
          endpoint="states/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "en_name", label: "English Name" },
            { key: "ar_name", label: "Arabic Name" },
            { key: "governorate.en_name", label: "English Governorate" },
            { key: "governorate.ar_name", label: "Arabic Governorate" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
      {showImport && (
        <ImportDialog
          endpoint="states/import"
          onClose={() => setShowImport(false)}
          onSubmitSuccess={() => {
            setShowImport(false);
            fetchStates(currentPage);
          }}
        />
      )}
    </div>
  );
};

export default StateIndex;
