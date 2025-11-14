import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/Pagination";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { RefreshCcw, Search, Eye } from "lucide-react";
import axiosMerchant from "@/axios";
import { handleError } from "@/utils/helpers";
import GuestDriverView from "./GuestDriverView";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/misc/Select";
import toast from "react-hot-toast";
import ConvertGuestDialog from "./ConvertGuestDialog";

const GuestDrivers = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Convert dialog state
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertRecord, setConvertRecord] = useState(null);

  useEffect(() => {
    fetchDrivers(currentPage);
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        setRefreshBtn(true);
        setCurrentPage(1);
        fetchDrivers(1, search.trim());
      } else {
        setRefreshBtn(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDrivers = async (pageNumber = 1, query = "") => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.query = query;
      const response = await axiosMerchant.get(
        `guest-drivers/drivers?page=${pageNumber}&per_page=${itemsPerPage}`,
        { params }
      );
      if (response.data.success) {
        if (response.data.data?.data) {
          setDrivers(response.data.data.data);
          setLinks(response.data.data.links);
        } else {
          setDrivers(response.data.data);
          setLinks([]);
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchDrivers(1);
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // View dialog handlers
  const openViewDialog = (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };
  const closeViewDialog = () => {
    setSelectedRecord(null);
    setViewDialogOpen(false);
    fetchDrivers(currentPage);
  };

  return (
    <div className="p-4">
      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold mb-6">{t("Guest Drivers")}</h1>
        <div className="flex items-center gap-2 flex-col md:flex-row">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Input
                placeholder={t("Search Guest Drivers...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-64 pr-8"
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none" />
            </div>
            <Button
              type="button"
              variant="refresh"
              onClick={handleRefresh}
              title={t("Refresh")}
            >
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
        </div>
      </div>

      <div className="shadow-md py-4 rounded-lg bg-white dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#</TableHead>
              <TableHead>{t("Name")}</TableHead>
              <TableHead>{t("Email")}</TableHead>
              <TableHead>{t("Phone")}</TableHead>
              <TableHead>{t("Company")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("Created At")}</TableHead>
              <TableHead className="text-center">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : drivers && drivers.length > 0 ? (
              drivers.map((driver, index) => (
                <TableRow key={driver.id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.email}</TableCell>
                  <TableCell>{driver.driver?.phone || "-"}</TableCell>
                  <TableCell>{driver.driver?.company_name || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        driver.driver?.status === "approved"
                          ? "success"
                          : driver.driver?.status === "rejected"
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {driver.driver?.status === "approved"
                        ? t("Approved")
                        : driver.driver?.status === "rejected"
                        ? t("Rejected")
                        : t("Pending")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {driver.created_at
                      ? new Date(driver.created_at).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(driver)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {t("View")}
                      </Button>

                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          setConvertRecord(driver);
                          setConvertOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2l4-4"
                          />
                        </svg>
                        {t("convert_to_driver")}
                      </Button>
                    </div>
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

        {links && links.length > 0 && (
          <Pagination
            links={links}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* View Dialog */}
      {viewDialogOpen && (
        <GuestDriverView record={selectedRecord} onClose={closeViewDialog} />
      )}

      {/* Convert Dialog */}
      {convertOpen && (
        <ConvertGuestDialog
          open={convertOpen}
          record={convertRecord}
          onClose={() => {
            setConvertOpen(false);
            setConvertRecord(null);
          }}
          onSuccess={(updatedDriver) => {
            // remove row after conversion, fallback refresh if needed
            if (updatedDriver?.id) {
              setDrivers((prev) =>
                prev.filter((u) => (u?.driver?.id ?? null) !== updatedDriver.id)
              );
            } else {
              toast.success(t("Converted to driver successfully"));
              fetchDrivers(currentPage);
            }
          }}
        />
      )}
    </div>
  );
};

export default GuestDrivers;
