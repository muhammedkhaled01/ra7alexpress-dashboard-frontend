import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "@/components/NoRecordFound";
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
import Pagination from "@/components/Pagination";
import { MoreHorizontal, Pencil, Trash2Icon, RefreshCcw } from "lucide-react";
import { can, formatCurrentCurrency, formatDecimalValue, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import Search from "@/components/misc/Search";
import Select from "@/components/misc/Select";
import Create from "./Create";
import Edit from "./Edit";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";

const labelForWarehouse = (w) => {
  if (w === "first_warehouse") return "First warehouse";
  if (w === "other_warehouse") return "Other warehouse";
  return w ?? "-";
};

const TransferFeesIndex = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const { currencyEnglishName, currencyArabicName, decimalPrecision } = useSelector((state) => state.setting)
  const { language } = useLanguage();

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const accessAbility = can("TransferFee access") ?? true;
  const createAbility = can("TransferFee create") ?? true;
  const updateAbility = can("TransferFee update") ?? true;
  const deleteAbility = can("TransferFee delete") ?? true;

  useEffect(() => {
    if (!accessAbility) navigate("unauthorized");
    fetchRows(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const fetchRows = async (pageNumber) => {
    setLoading(true);
    try {
      const { data } = await axiosMerchant.get(
        `/transfer-fees?page=${pageNumber}&per_page=${itemsPerPage}${search ? `&query=${encodeURIComponent(search)}` : ""
        }`
      );
      const payload = data?.data ?? {};
      // support both shapes: {data:[],links:[]} or plain []
      setRows(Array.isArray(payload) ? payload : payload.data ?? []);
      setLinks(Array.isArray(payload) ? [] : payload.links ?? []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setRefreshBtn(true);
    fetchRows(1);
  };

  const onRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchRows(currentPage);
  };

  const onSubmitSuccess = () => fetchRows(currentPage);

  return (
    <div>
      <PageTitle title={t("Transfer Fees")} />

      <div className="flex flex-col md:flex-row gap-3 justify-between mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={onSubmitSuccess} />}
        </div>

        <div className="flex items-center gap-2 flex-col md:flex-row">
          <Search
            searchValue={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            onSearchSubmit={onSearch}
            onRefresh={onRefresh}
            showRefresh={refreshBtn}
            placeholder={t("Search by key or amount...")}
          />
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <Select
              value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
              onChange={(opt) => setItemsPerPage(Number(opt.value))}
              options={[5, 8, 15, 25, 50, 100].map((v) => ({
                value: v,
                label: String(v),
              }))}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
          <Button variant="refresh" onClick={onRefresh}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>{t("Warehouse")}</TableHead>
              <TableHead>{t(`Fee`)} ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})</TableHead>
              <TableHead>{t("Last Update")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : rows && rows.length ? (
              rows.map((r, idx) => (
                <TableRow key={`${r.id}-${idx}`}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{labelForWarehouse(r.warehouse)}</TableCell>
                  <TableCell>{formatDecimalValue(Number(r.amount ?? 0), decimalPrecision)}</TableCell>
                  <TableCell>
                    {r.updated_at
                      ? new Date(r.updated_at).toLocaleDateString()
                      : "-"}
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
                            onClick={() => {
                              setSelectedRecord(r);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRecord(r);
                              setDeleteAlert(true);
                            }}
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
                <TableCell colSpan={5} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={onSubmitSuccess}
          record={selectedRecord}
          onClose={() => setDeleteAlert(false)}
          api={"/transfer-fees/delete"}
        />
      )}

      {editOpen && (
        <Edit
          record={selectedRecord}
          onSubmitSuccess={onSubmitSuccess}
          onClose={() => {
            setSelectedRecord(null);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default TransferFeesIndex;
