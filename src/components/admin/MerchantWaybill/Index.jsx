import { useEffect, useState, useCallback } from "react";
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
import { Plus, RefreshCcw, Ticket } from "lucide-react";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";
import Select from "@/components/misc/Select";

const MerchantWaybillIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [merchantWaybills, setMerchantWaybills] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const accessAbility = can("Merchant Waybill access");
  const createAbility = can("Merchant Waybill create");
  // const updateAbility = can("Merchant Waybill update");
  const deleteAbility = can("Merchant Waybill delete");

  const location = useLocation();
  useEffect(() => {
    if (location.state?.from === "/create-merchant-waybill") {
      handleRefresh();
    }
  }, [location]);

  const openDeleteAlert = (record) => {
    setSelectedRecord(record);
    setDeleteAlert(true);
  };
  const closeDeleteAlert = () => {
    setSelectedRecord(null);
    setDeleteAlert(false);
  };

  const openEditDialog = (record) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };
  const closeEditDialog = () => {
    setSelectedRecord(null);
    setEditDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    if (!accessAbility) navigate("/unauthorized");
    fetchMerchantWaybills(currentPage);
  }, [currentPage, accessAbility, navigate, itemsPerPage]);

  const fetchMerchantWaybills = useCallback(
    async (pageNumber) => {
      setLoading(true);
      try {
        const response = await axiosMerchant.get(
          `merchant_waybills?page=${pageNumber}&per_page=${itemsPerPage}`
        );
        setLinks(response.data.data.links || []);
        setMerchantWaybills(response.data.data.data || []);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage]
  );

  const handleSearch = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setLoading(true);
      try {
        const response = await axiosMerchant.get(
          `merchant_waybills?query=${search}`
        );
        setMerchantWaybills(response.data.data || []);
        setLinks([]);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, handleSearch, fetchMerchantWaybills]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    fetchMerchantWaybills(currentPage);
  }, [fetchMerchantWaybills, currentPage]);

  const handleSubmitSuccess = () => fetchMerchantWaybills(currentPage);

  // helper: افتح أحدث Batch للتاجر (لو موجود)
  const handleViewLatestBatch = async (merchantUserId) => {
    try {
      const res = await axiosMerchant.get(
        `/merchant_waybills/batches?merchant_id=${merchantUserId}&per_page=1`
      );
      const latest = res.data?.data?.data?.[0];
      if (latest) {
        navigate(
          `/merchant/view-merchant-waybill/${merchantUserId}?batch_id=${latest.id}`
        );
      } else {
        navigate(`/merchant/view-merchant-waybill`); // fallback
      }
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <div>
      <PageTitle title={t("Merchant Waybills")} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        <div className="flex justify-start">
          {createAbility && (
            <Link to={"/create-merchant-waybill"}>
              <Button type="button" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>{t("Create Waybills")}</span>
              </Button>
            </Link>
          )}
        </div>
        <div className="flex md:items-center gap-2 flex-col md:flex-row">
          <form
            onSubmit={handleSearch}
            className="flex justify-end w-full md:w-auto"
          >
            <div className="flex flex-col md:flex-row md:gap-x-2 w-full">
              <Input
                name="search"
                type="text"
                className="w-full md:w-[200px]"
                value={search}
                id="search"
                placeholder={t("Search Merchant Waybills...")}
                onChange={(e) => setSearch(e.target.value)}
                icon={
                  search.trim() !== "" && (
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
              onChange={(opt) => setItemsPerPage(Number(opt.value))}
              options={[5, 8, 15, 25, 50, 100].map((n) => ({
                value: n,
                label: String(n),
              }))}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("#")}</TableHead>
              <TableHead isFixed>{t("Merchant")}</TableHead>
              <TableHead>{t("Waybills")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : merchantWaybills.length > 0 ? (
              merchantWaybills.map((merchantWaybill, index) => (
                <TableRow key={merchantWaybill.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell isFixed>{merchantWaybill.name}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      className="ml-1"
                      variant="default"
                      onClick={() => handleViewLatestBatch(merchantWaybill.id)}
                    >
                      <Ticket className="h-6 w-6" />
                    </Button>
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
        <Pagination links={links} onPageChange={setCurrentPage} />
      </div>

      {/* اختياري: Edit/Delete كما كان */}
      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"merchantWaybills/delete"}
        />
      )}
    </div>
  );
};

export default MerchantWaybillIndex;
