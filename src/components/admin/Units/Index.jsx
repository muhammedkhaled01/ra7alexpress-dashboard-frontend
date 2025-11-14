import axiosMerchant from "@/axios";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../../ui/button";
import Select from "../../misc/Select";
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

import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  Download,
  EditIcon,
  Filter,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Trash2Icon,
  Upload,
  Pencil,
  Trash,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";

const UnitIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Unit access");
  const createAbility = can("Unit create");
  const updateAbility = can("Unit update");
  const deleteAbility = can("Unit delete");
  const exportAbility = can("Unit export");

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
  const fetchData = useCallback(async (pageNumber = 1) => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axiosMerchant.get('units', {
        params: {
          page: pageNumber,
          per_page: itemsPerPage,
          ...(search && { query: search })
        }
      });
      
      if (response.data.data) {
        setLinks(response.data.data.links || []);
        setUnits(response.data.data.data || []);
      } else {
        setLinks([]);
        setUnits([]);
      }
    } catch (error) {
      handleError(error);
      setLinks([]);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [search, itemsPerPage, accessAbility, navigate]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    setRefreshBtn(true);
    fetchData(1);
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchData(1);
  }, [fetchData]);

  const handleSubmitSuccess = () => {
    fetchData(currentPage);
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
      <PageTitle title={t("Units")} />
      <div className="flex flex-wrap justify-between gap-3 mt-2">
        {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        <div className="flex items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                placeholder={t("Search-unit")}
                onChange={(e) => setSearch(e.target.value)}
                icon={
                  refreshBtn && (
                    <RefreshCw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                  )
                }
              />
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4" />
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
          {exportAbility && (
            <div>
              <Button variant="download" type="button" onClick={e => setShowExport(true)}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
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
        ) : units && units.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Name")}</TableHead>
                  {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell isFixed>
                      {unit.name}
                      <div className="flex justify-center gap-x-2 mt-2">
                        {updateAbility && (
                          <Button
                            onClick={() => openEditDialog(unit)}
                            variant="edit"
                            size="xs"
                          >
                            <Pencil />
                          </Button>
                        )}
                        {deleteAbility && (
                          <Button
                            onClick={() => openDeleteAlert(unit)}
                            type="button"
                            variant="delete"
                            size="xs"
                          >
                            <Trash2Icon />
                          </Button>
                        )}
                      </div>
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
                            <DropdownMenuItem
                              onClick={() => openEditDialog(unit)}
                            >
                              <EditIcon className="p-1" /> {t("Edit")}
                            </DropdownMenuItem>
                          )}
                          {deleteAbility && (
                            <DropdownMenuItem
                              onClick={() => openDeleteAlert(unit)}
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
          <TableRow>
            <TableCell colSpan={11} className="text-center">
              <NoRecordFound />
            </TableCell>
          </TableRow>
        )}
      </div >

      {
        deleteAlert && (
          <DeleteAlert
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeDeleteAlert}
            api={"units/delete"}
          />
        )
      }
      {
        editDialogOpen && (
          <Edit
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeEditDialog}
          />
        )
      }

      {showExport && (
        <ExportDialog
          model="units"
          endpoint="units/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          // filters={[
          //   {
          //     key: "payment_method",
          //     label: "Select Payment Method",
          //     type: "select",
          //     options: [
          //       { value: "all", label: "All Payment Methods" },
          //       { value: "cash", label: "Cash" },
          //       { value: "card", label: "Card" }
          //     ],
          //     defaultValue: "all"
          //   }
          // ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div >
  );
};

export default UnitIndex;
