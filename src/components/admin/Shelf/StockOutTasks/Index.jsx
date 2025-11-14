import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";


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
  EditIcon,
  Filter,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, humanizeText, isAuthorized } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import NoRecordFound from "@/components/NoRecordFound";
import PageTitle from "../../Layouts/PageTitle";
import { Badge } from "@/components/ui/badge";
import View from "./StockoutShipments";
import Select from "@/components/misc/Select";

const StockOutIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [stockOuts, setStockOuts] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("StockOutTask access");
  const createAbility = can("StockOutTask create");
  const updateAbility = can("StockOutTask update");
  const deleteAbility = can("StockOutTask delete");

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

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchStockOuts(currentPage);
  }, [currentPage, itemsPerPage]);

  const fetchStockOuts = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`stockout_tasks?page=${pageNumber}&per_page=${itemsPerPage}`);
      setLinks(response.data.data.links);
      setStockOuts(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`stockout_tasks?query=${search}`);
      setStockOuts(response.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchStockOuts();
  };

  const handleSubmitSuccess = () => {
    fetchStockOuts(currentPage);
  };

  if (!isAuthorized(["StockOutTask access"])) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <div className="flex justify-between mt-2">
        <PageTitle title={t("Stock Out Tasks")} />
        {/* <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div> */}

        <form className="flex md:items-center flex-col md:flex-row gap-2" action="" onSubmit={handleSearch}>
          <div className="flex space-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              id="search"
              placeholder={t("Search")}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="filter" type="submit">
              <Filter />
            </Button>
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
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>{t("Created By")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("Created at")}</TableHead>
              <TableHead>{t("View")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : stockOuts && stockOuts.length > 0 ? (
              stockOuts.map((stockOut, index) => (
                <TableRow key={index}>
                  <TableHead className="w-[100px] sticky left-0 bg-white z-10">
                    #
                  </TableHead>
                  <TableCell>{stockOut.created_by?.name}</TableCell>
                  <TableCell><Badge variant={"delivered"}>{humanizeText(stockOut.status)}</Badge></TableCell>
                  <TableCell>{new Date(stockOut.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <View
                      tigger={
                        <Button
                          size="icon"
                          className="ml-1"
                          variant="default"
                        >
                          {stockOut?.shipments.length || "0"}
                        </Button>
                      }
                      record={stockOut?.shipments}
                    />
                  </TableCell>
                  <TableCell className="text-right">
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
                            onClick={() => openEditDialog(stockOut)}
                          >
                            <Pencil className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(stockOut)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
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
          api={"stockOuts/delete"}
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
};

export default StockOutIndex;
