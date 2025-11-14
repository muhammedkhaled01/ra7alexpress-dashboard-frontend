import axiosMerchant from "@/axios";
import React, { useEffect, useState, useCallback } from "react";
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

import { Link, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  RefreshCcw,
  LucideLoader,
  PrinterIcon,
  Trash2Icon,
  EditIcon,
  Copy,
  Check,
  Pencil,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Create from "./Create";
import Edit from "./Edit";
import { can, hasRole, printLabel } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { getShelfCategories } from "@/stores/features/ajaxFeature";
import { useDispatch } from "react-redux";
import Select from "@/components/misc/Select";

const ShelfCategory = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(null);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const { t } = useTranslation();

  const accessAbility = can("Shelf Category access");
  const createAbility = can("Shelf Category create");
  const updateAbility = can("Shelf Category update");
  const deleteAbility = can("Shelf Category delete");

  const isSuperAdmin = hasRole("Super Admin");

  const dispatch = useDispatch();
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, itemsPerPage]);

  const fetchData = async (currentPage) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(
        `shelf-categories?page=${currentPage}&per_page=${itemsPerPage}`
      );
      setLinks(response.data.data.links);
      setCategories(response.data.data.data);
      await dispatch(getShelfCategories());
    } catch (error) {
      console.error("Error fetching shelf categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`shelf-categories`, {
        params: {
          search: search,
        },
      });
      setCategories(response.data.data.data || response.data.data);
      setLinks([]);
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchData();
  };

  const handleSubmitSuccess = () => {
    fetchData(currentPage);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  // DELETE ALERT
  const openDeleteAlert = (category) => {
    setselectedRecord(category);
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

  const handleCopy = async (barcode) => {
    await navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);

    setTimeout(() => {
      setCopiedBarcode(null);
    }, 2000);
  };

  const handlePrint = async (category) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [category.id]: true }));
      const response = await axiosMerchant.get(`shelf-categories/printCategory`, {
        params: { id: category.id },
      });

      printLabel(response.data);
      setIsPrinting((prev) => ({ ...prev, [category.id]: false }));
    } catch (error) {
      setIsPrinting((prev) => ({ ...prev, [category.id]: false }));
      console.error("Error fetching category data for printing:", error);
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Shelf Category access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <PageTitle title={t("Shelf Categories")} />
      <div className="flex justify-between mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>

        <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              id="search"
              placeholder={t("Search By Name...")}
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

      <div className="shadow-md p-4 mt-4 rounded-lg">
        {loading ? (
          <Loader />
        ) : categories?.length === 0 ? (
          <NoRecordFound message={t("No category found")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("Name")}</TableHead>
                <TableHead isFixed>{t("Barcode")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{category?.name}</TableCell>
                  <TableCell isFixed>
                    <div className="flex items-center justify-center gap-x-2">
                      <button
                        onClick={() => handleCopy(category.barcode)}
                        className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                        aria-label="Copy barcode"
                      >
                        {copiedBarcode === category.barcode ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                      <span className="font-medium">{category.barcode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-x-2">
                      <Button
                        variant="print"
                        onClick={() => handlePrint(category)}
                        disabled={isPrinting[category.id]}
                      >
                        {isPrinting[category.id] ? (
                          <LucideLoader className="h-4 w-4 animate-spin inline-block" />
                        ) : (
                          <PrinterIcon className="h-6 w-6" />
                        )}
                      </Button>
                      {deleteAbility && (
                        <Button
                          variant="delete"
                          onClick={() => openDeleteAlert(category)}
                        >
                          <Trash2Icon className="h-5 w-5" />
                        </Button>
                      )}
                      {updateAbility && (
                        <Button
                          variant="edit"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="mt-4">
          <Pagination links={links} onPageChange={handlePageChange} />
        </div>

        {deleteAlert && (
          <DeleteAlert
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeDeleteAlert}
            api={"shelf-categories/delete"}
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
    </div>
  );
};

export default ShelfCategory;
