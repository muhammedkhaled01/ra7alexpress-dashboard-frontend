import axiosMerchant from "@/axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import CODCollectionTable from "./CODCollectionTable";
import CODCollectionFilter from "./CODCollectionFilter";
import { can, formatCurrentCurrency, formatDecimalValue } from "@/utils/helpers";
import { useLanguage } from "@/contexts/LanguageProvider";
import moment from "@/utils/moment";
import LineChartComponent from "@/components/charts/LineChartComponent";
import {
  LayoutGrid,
  LineChart,
  Users,
  Wallet,
  FileSignature,
  Banknote,
  CreditCard,
  Container,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportDialog from "@/components/misc/ExportDialog";
import { useSelector } from "react-redux";
import Pagination from "@/components/Pagination";

const CODCollectionPending = () => {
  const { decimalPrecision } = useSelector((state) => state.setting);
  const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
  const {language} = useLanguage();
  useEffect(() => { 
    if (performanceSummary.totalMoney > 0) {
      const updatedSummary = { ...performanceSummary };
      if (updatedSummary.totalMoney) {
        updatedSummary.totalMoney = parseFloat(updatedSummary.totalMoney);
      }
      if (updatedSummary.signedMoney) {
        updatedSummary.signedMoney = {
          cash: parseFloat(updatedSummary.signedMoney.cash || 0),
          pos: parseFloat(updatedSummary.signedMoney.pos || 0),
          total: parseFloat(updatedSummary.signedMoney.total || 0),
        };
      }
      setPerformanceSummary(updatedSummary);
    }
  }, [decimalPrecision]);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canAccess = can("COD collections access");

  const [loading, setLoading] = useState(true);
  const [runsheets, setRunsheets] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [manifestId, setManifestId] = useState("");
  const today = moment().format("YYYY-MM-DD");
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [links, setLinks] = useState();
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const [dateRange, setDateRange] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
  });
  const [createTimeRange, setCreateTimeRange] = useState({
    from: "",
    to: "",
    from_time: "00:00",
    to_time: "23:59",
  });
  const [confirmTimeRange, setConfirmTimeRange] = useState({
    from: "",
    to: "",
    from_time: "00:00",
    to_time: "23:59",
  });
  const [performanceSummary, setPerformanceSummary] = useState({
    driverCount: 0,
    totalMoney: 0,
    signedMoney: {
      cash: 0,
      pos: 0,
      total: 0,
    },
  });
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [displayMode, setDisplayMode] = useState("cards"); // 'chart' or 'cards'
  const [showExport, setShowExport] = useState(false);
  const [btnLoading, setBtnLoading] = useState({
    exportBtn: false,
  });
  const fetchCOD = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        driver_id: selectedDriver || "",
        company_id: selectedCompany || "",
        start_date: `${dateRange.from} ${dateRange.from_time}` || "",
        end_date: `${dateRange.to} ${dateRange.to_time}` || "",
        create_date_start: `${createTimeRange.from} ${createTimeRange.from_time}` || "",
        create_date_end: `${createTimeRange.to} ${createTimeRange.to_time}` || "",
        confirm_date_start: `${confirmTimeRange.from} ${confirmTimeRange.from_time}` || "",
        confirm_date_end: `${confirmTimeRange.to} ${confirmTimeRange.to_time}` || "",
        manifest_id: manifestId || "",
        page: currentPage,
        per_page: itemsPerPage,
      };

      const query = Object.entries(params)
        .filter(([, v]) => v !== "")
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");

      const response = await axiosMerchant.get(`cod_collection/pending?${query}`);
      console.log("Full response:", response.data);

      // Extract data from the response
      const { data, success } = response.data.data;

      // Set the runsheets from the paginated data
      setRunsheets(data?.data ?? []);
      setLinks(data?.links ?? []);

      // Set the performance summary
      // setPerformanceSummary(success.performance_summary);
      const ps = success?.performance_summary || {};
      setPerformanceSummary({
        driverCount: ps.driver_count ?? 0,
        totalMoney: ps.total_money ?? 0,
        signedMoney: {
          cash: ps.signed_money?.cash ?? 0,
          pos: ps.signed_money?.pos ?? 0,
          total: ps.signed_money?.total ?? 0,
        },
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching COD data:", error);
      setLoading(false);
    }
  }, [
    selectedDriver,
    selectedCompany,
    dateRange,
    createTimeRange,
    confirmTimeRange,
    manifestId,
    itemsPerPage,
    currentPage,
  ]);
  const handleSubmitSuccess = useCallback(() => {
    fetchCOD();
  }, [fetchCOD]);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axiosMerchant.get("cod_collection/drivers/pending");
      setDrivers(response.data.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }, []);

  const fetchCompanies = useCallback(() => {
    axiosMerchant
      .get(`companies`)
      .then((response) => {
        setCompanies(response.data.data.data);
      })
      .catch((error) => {
        console.error("Error fetching companies:", error);
      });
  }, []);

  useEffect(() => {
    fetchDrivers();
    fetchCompanies();
  }, [fetchDrivers, fetchCompanies]);

  useEffect(() => {
    fetchCOD();
  }, [fetchCOD]);

  const isConfirmationAllowed = useCallback((runsheet) => {
    return !runsheet.confirmed && !runsheet.holding;
  }, []);

  if (!canAccess) {
    navigate("/unauthorized");
    return null;
  }

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t("COD Collection")}</h1>
          <div>
            <Button
              type="button"
              onClick={() => setShowExport(true)}
              disabled={btnLoading.exportBtn}
              variant="export"
            >
              {btnLoading.exportBtn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Container />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setDisplayMode(displayMode === "chart" ? "cards" : "chart")
              }
              title={t("Toggle display mode")}
            >
              {displayMode === "chart" ? (
                <LayoutGrid className="w-5 h-5" />
              ) : (
                <LineChart className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {displayMode === "chart" ? (
          <div className="h-[300px] mt-4">
            <LineChartComponent
              data={[
                {
                  title: t("Total Money"),
                  value: performanceSummary?.total_money || 0,
                },
                {
                  title: t("Signed Money"),
                  value: performanceSummary?.signed_money?.total || 0,
                },
                {
                  title: t("Cash"),
                  value: performanceSummary?.signed_money?.cash || 0,
                },
                {
                  title: t("POS"),
                  value: performanceSummary?.signed_money?.pos || 0,
                },
              ]}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
            <Card className="p-4 flex flex-col items-center">
              <Users className="w-8 h-8 mb-2 text-primary" />
              <h3 className="font-medium">{t("Driver Count")}</h3>
              <p className="text-2xl font-bold">
                {performanceSummary?.driverCount || 0}
              </p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <Wallet className="w-8 h-8 mb-2 text-primary" />
              <h3 className="font-medium">{t(`Total Money`)}  ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})</h3>
              <p className="text-2xl font-bold">
                {formatDecimalValue(performanceSummary?.totalMoney, decimalPrecision) || "0.00"}
              </p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <FileSignature className="w-8 h-8 mb-2 text-primary" />
              <h3 className="font-medium">{t(`Signed Money`)}  ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})</h3>
              <p className="text-2xl font-bold">
                {formatDecimalValue(performanceSummary?.signedMoney?.total, decimalPrecision) ||
                  "0.00"}
              </p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <Banknote className="w-8 h-8 mb-2 text-primary" />
              <h3 className="font-medium">{t("Cash")}</h3>
              <p className="text-2xl font-bold">
                {formatDecimalValue(performanceSummary?.signedMoney?.cash, decimalPrecision) ||
                  "0.00"}
              </p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <CreditCard className="w-8 h-8 mb-2 text-primary" />
              <h3 className="font-medium">{t("POS")}</h3>
              <p className="text-2xl font-bold">
                {formatDecimalValue(performanceSummary?.signedMoney?.pos, decimalPrecision) ||
                  "0.00"}
              </p>
            </Card>
          </div>
        )}
        <div className="flex flex-col gap-2 md:flex-row justify-between md:items-start">
          <div className="flex-1">
            <CODCollectionFilter
              tabName="pending"
              drivers={drivers}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              companies={companies}
              selectedDriver={selectedDriver}
              selectedCompany={selectedCompany}
              manifestId={manifestId}
              dateRange={dateRange}
              createTimeRange={createTimeRange}
              confirmTimeRange={confirmTimeRange}
              onDriverChange={(driverId) => {
                setSelectedDriver(driverId);
                fetchCOD();
              }}
              onCompanyChange={(companyId) => {
                setSelectedCompany(companyId);
                fetchCOD();
              }}
              onManifestIdChange={setManifestId}
              onDateRangeChange={setDateRange}
              onCreateTimeRangeChange={setCreateTimeRange}
              onConfirmTimeRangeChange={setConfirmTimeRange}
              onReset={(e) => {
                e.stopPropagation();
                setSelectedCompany("");
                setSelectedDriver("");
                setManifestId("");
                setDateRange({
                  from: today,
                  to: today,
                  from_time: "00:00",
                  to_time: "23:59",
                });
                setCreateTimeRange({ from: "", to: "", from_time: "00:00", to_time: "23:59" });
                setConfirmTimeRange({ from: "", to: "", from_time: "00:00", to_time: "23:59" });
                fetchCOD();
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="mb-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-y-3 md:flex-row justify-between items-start md:items-center">
                <CardTitle>{t("To Confirm")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="shadow-md py-4 rounded-lg">
                <CODCollectionTable
                  runsheets={runsheets}
                  loading={loading}
                  t={(key) => t(key)}
                  onConfirm={handleSubmitSuccess}
                  onHold={handleSubmitSuccess}
                  isConfirmationAllowed={isConfirmationAllowed}
                  state="pending"
                  showActions={true}
                  showHoldReason={true}
                  showTotalAmount={true}
                  showCollectionMoney={true}
                  showDTO={true}
                  showDifference={true}
                />
              </div>
              {links && links.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    links={links}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
      {showExport && (
        <ExportDialog
          model="cod_collection"
          endpoint="cod_collection/export_runsheets"
          additionalData={{
            driver_id: selectedDriver || "",
            company_id: selectedCompany || "",
            start_date: dateRange.from || "",
            end_date: dateRange.to || "",
            create_date_start: createTimeRange.from || "",
            create_date_end: createTimeRange.to || "",
            confirm_date_start: confirmTimeRange.from || "",
            confirm_date_end: confirmTimeRange.to || "",
            manifest_id: manifestId || "",
            status: "pending",
          }}
          fields={[
            { key: "id", label: t("Runsheet ID") },
            { key: "company", label: t("Company") },
            { key: "driver", label: t("Driver Name") },
            { key: "driver_phone", label: t("Driver Phone") },
            { key: "receive_date", label: t("Receive Date") },
            { key: "create_time", label: t("Create Time") },
            { key: "confirmed_date", label: t("Confirmed Date") },
            { key: "confirmed_time", label: t("Confirmed Time") },
            { key: "status", label: t("Status") },
            { key: "total_ra7als", label: t("Total Parcels") },
            { key: "to_sign_ra7als", label: t("To Sign Parcels") },
            { key: "signed_ra7als", label: t("Signed Parcels") },
            { key: "holding_ra7als", label: t("Holding Parcels") },
            { key: "not_signed_ra7als", label: t("Not Signed Parcels") },
            { key: "returned_ra7als", label: t("Returned Parcels") },
            { key: "dto_ra7als", label: t("DTO Parcels") },
            { key: "difference_ra7als", label: t("Difference Parcels") },
            { key: "signed_money_cash", label: t("Signed Money (Cash)") },
            { key: "signed_money_pos", label: t("Signed Money (POS)") },
            { key: "signed_money_total", label: t("Signed Money (Total)") },
            {
              key: "collection_money_cash",
              label: t("Collection Money (Cash)"),
            },
            { key: "collection_money_pos", label: t("Collection Money (POS)") },
            {
              key: "collection_money_total",
              label: t("Collection Money (Total)"),
            },
            { key: "collection_difference", label: t("Collection Difference") },
            { key: "hold_reason", label: t("Hold Reason") },
            { key: "total_amount", label: t("Total Amount") },
            { key: "received_by", label: t("Received By") },
          ]}
          onClose={() => setShowExport(false)}
          onExport={() => setBtnLoading({ ...btnLoading, exportBtn: true })}
          onExportSuccess={() =>
            setBtnLoading({ ...btnLoading, exportBtn: false })
          }
        />
      )}
    </div>
  );
};

export default CODCollectionPending;
