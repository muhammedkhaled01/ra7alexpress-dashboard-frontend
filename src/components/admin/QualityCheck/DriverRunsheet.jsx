import React, { useCallback, useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import Pagination from "@/components/Pagination";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import Select from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMerchants,
  getDrivers,
  getSystemDeliveryExceptions,
} from "@/stores/features/ajaxFeature";
import { can, handleError, humanizeText } from "@/utils/helpers";
import View from "./RunsheetShipmentsView";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import moment from "@/utils/moment";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";

function DriverRunsheet() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [runsheets, setRunsheets] = useState(null);
  const [driverValue, setDriverValue] = useState(null);

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const drivers = useSelector((store) => store.ajax.drivers);
  const merchants = useSelector((store) => store.ajax.merchants);
  const systemDeliveryExceptions = useSelector(
    (store) => store.ajax.systemDeliveryExceptions
  );

  // ---------- Date/Time range state (same style as DriverAccounts) ----------
  const today = moment().format("YYYY-MM-DD");
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const buildDateTime = (d, t) => `${d} ${t}`;

  // -------------------------------------------------------------------------

  const fetchRunsheets = useCallback(async () => {
    setLoading(true);
    const form = new FormData();

    if (driverValue) {
      form.append("driver_id", driverValue.value);
    }

    // ⬇️ غيّر أسماء البراميترز هنا لو الـ API مختلفة عندك
    form.append(
      "manifest_date_from",
      buildDateTime(filters.from, filters.from_time)
    );
    form.append("manifest_date_to", buildDateTime(filters.to, filters.to_time));

    try {
      const response = await axiosMerchant.post(
        `driver_runsheet?page=${currentPage}&per_page=${itemsPerPage}`,
        form
      );
      setRunsheets(response.data?.data?.data || []);
      setLinks(response.data?.data?.links || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    driverValue,
    filters.from,
    filters.to,
    filters.from_time,
    filters.to_time,
  ]);

  useEffect(() => {
    if (!drivers) dispatch(getDrivers());
    if (!merchants) dispatch(getMerchants());
    if (!systemDeliveryExceptions) dispatch(getSystemDeliveryExceptions());
  }, [dispatch, drivers, merchants, systemDeliveryExceptions]);

  useEffect(() => {
    fetchRunsheets();
  }, [fetchRunsheets]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const onFilter = () => {
    setCurrentPage(1);
    fetchRunsheets();
  };

  const handleRefresh = () => {
    setDriverValue(null);
    setCurrentPage(1);
    setItemsPerPage(10);
    setFilters({
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
    });
    fetchRunsheets();
  };

  const navigate = useNavigate();
  const canAccess = can("Driver Runsheet access");
  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card>
        <CardContent className="mt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left: Filters */}
            <div className="flex flex-wrap gap-4 mt-2 items-end">
              <div className="w-[250px]">
                <label htmlFor="">{t("Driver")}</label>
                <Select
                  name="driver"
                  placeholder={t("Driver")}
                  options={drivers?.map((driver) => ({
                    label: driver.name,
                    value: driver.id,
                  }))}
                  value={driverValue}
                  onChange={(e) => setDriverValue(e)}
                />
              </div>

              {/* DateTimeRangePicker like DriverAccounts */}
              <div className="flex flex-col input-container">
                <label className="mb-1">{t("Date & Time Range")}</label>
                <DateTimeRangePicker
                  filters={filters}
                  onChange={handleFilterChange}
                  t={t}
                />
              </div>

              <Button variant="secondary" onClick={onFilter}>
                {t("Filter")}
              </Button>
            </div>

            {/* Right: per-page + refresh */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  {t("Show")}
                </label>
                <Select
                  value={{
                    value: itemsPerPage,
                    label: itemsPerPage.toString(),
                  }}
                  onChange={(selectedOption) => {
                    setItemsPerPage(Number(selectedOption.value));
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 5, label: "5" },
                    { value: 10, label: "10" },
                    { value: 15, label: "15" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" },
                  ]}
                  className="w-20 text-sm"
                  isSearchable={false}
                />
              </div>
              <div className="flex gap-x-2">
                <Button type="button" variant="refresh" onClick={handleRefresh}>
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t("Run Sheet")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Reference no")}</TableHead>
                  <TableHead isFixed>{t("Driver")}</TableHead>
                  <TableHead>{t("Date")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Shipments")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : runsheets && runsheets.length > 0 ? (
                  runsheets.map((runsheet, index) => (
                    <TableRow key={index}>
                      <TableCell>{runsheet.id}</TableCell>
                      <TableCell isFixed>{runsheet.driver?.name}</TableCell>
                      <TableCell>
                        {new Intl.DateTimeFormat("en-US", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(new Date(runsheet.created_at))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="exception" className="cursor-pointer">
                          {humanizeText(runsheet.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <View
                          tigger={
                            <Button
                              size="icon"
                              className="ml-1"
                              variant="default"
                            >
                              {runsheet?.assigned_shipments_count || ""}
                            </Button>
                          }
                          record={runsheet.assigned_shipments}
                        />
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
        </CardContent>
      </Card>
    </div>
  );
}

export default DriverRunsheet;
