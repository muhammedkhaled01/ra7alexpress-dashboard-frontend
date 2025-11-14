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

const DriverWaybillIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [driversWithWaybills, setDriversWithWaybills] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const accessAbility = can("Driver Waybill access");
  const createAbility = can("Driver Waybill create");
  const deleteAbility = can("Driver Waybill delete");

  const location = useLocation();
  useEffect(() => {
    if (location.state?.from === "/create-driver-waybill") handleRefresh();
  }, [location]);

  const openDeleteAlert = (record) => {
    setSelectedRecord(record);
    setDeleteAlert(true);
  };
  const closeDeleteAlert = () => {
    setSelectedRecord(null);
    setDeleteAlert(false);
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    if (!accessAbility) navigate("/unauthorized");
    fetchDrivers(currentPage);
  }, [currentPage, accessAbility, navigate, itemsPerPage]);

  const fetchDrivers = useCallback(
    async (pageNumber) => {
      setLoading(true);
      try {
        const res = await axiosMerchant.get(
          `driver_waybills?page=${pageNumber}&per_page=${itemsPerPage}`
        );
        setLinks(res.data?.data?.links || []);
        setDriversWithWaybills(res.data?.data?.data || res.data?.data || []);
      } catch (e) {
        handleError(e);
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage]
  );

  const handleSearch = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (!search.trim()) return;
      setLoading(true);
      try {
        const res = await axiosMerchant.get(
          `driver_waybills?query=${encodeURIComponent(search)}`
        );
        setDriversWithWaybills(res.data?.data || []);
        setLinks([]);
      } catch (e) {
        handleError(e);
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
  }, [search, handleSearch]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    fetchDrivers(currentPage);
  }, [fetchDrivers, currentPage]);

  const handleViewLatestBatch = async (driverUserId) => {
    try {
      const res = await axiosMerchant.get(
        `/driver_waybills/batches?driver_id=${driverUserId}&per_page=1`
      );
      const latest = res.data?.data?.data?.[0];
      if (latest)
        navigate(
          `/driver/view-driver-waybill/${driverUserId}?batch_id=${latest.id}`
        );
      else navigate(`/driver/view-driver-waybill/${driverUserId}`);
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <div>
      <PageTitle title={t("Driver Waybills")} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        <div className="flex justify-start">
          {createAbility && (
            <Link to={"/create-driver-waybill"}>
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
                placeholder={t("Search Driver Waybills...")}
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
              value={{ value: itemsPerPage, label: String(itemsPerPage) }}
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
              <TableHead isFixed>{t("Driver")}</TableHead>
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
            ) : driversWithWaybills?.length > 0 ? (
              driversWithWaybills.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell isFixed>{row.name}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      className="ml-1"
                      variant="default"
                      onClick={() => handleViewLatestBatch(row.id)}
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

      {deleteAbility && deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={() => fetchDrivers(currentPage)}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"driver_waybills/delete"}
        />
      )}
    </div>
  );
};

export default DriverWaybillIndex;
