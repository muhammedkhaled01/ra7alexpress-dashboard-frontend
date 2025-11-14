import React, { useEffect, useState } from "react";
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
import PageTitle from "../Layouts/PageTitle";
import Select from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMerchants,
  getDrivers,
  getSystemDeliveryExceptions,
} from "@/stores/features/ajaxFeature";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { can, handleError } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";
import moment from '@/utils/moment';
import { useLanguage } from "@/contexts/LanguageProvider";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";

function OFDList() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [shipments, setShipments] = useState([]);
  const [btnLoading, setBtnLoading] = useState(false);

  // Filter states
  const [driverValue, setDriverValue] = useState(null);
  const [paymentTypeValue, setPaymentTypeValue] = useState(null);
  const [exceptionValue, setExceptionValue] = useState(null);
  const [merchantValue, setMerchantValue] = useState(null);
  const [ofdValue, setOfdValue] = useState("");
  const today = moment().format('YYYY-MM-DD');

  const [dateRange, setDateRange] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
  });

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { language } = useLanguage()

  const drivers = useSelector((store) => store.ajax.drivers);
  const merchants = useSelector((store) => store.ajax.merchants);
  const systemDeliveryExceptions = useSelector(
    (store) => store.ajax.systemDeliveryExceptions
  );

  const fetchOFD = React.useCallback(async (pageNumber = 1) => {
    setLoading(true);
    setBtnLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNumber,
        per_page: itemsPerPage,
        query: search || '',
        driver: driverValue?.value || '',
        merchant: merchantValue?.value || '',
        payment_type: paymentTypeValue?.value || '',
        delivery_exception: exceptionValue?.value || '',
        ofd_times: ofdValue || '',
        from: `${dateRange?.from} ${dateRange?.from_time}`,
        to: `${dateRange?.to} ${dateRange?.to_time}`,
      });

      // Remove empty parameters
      Array.from(params.entries()).forEach(([key, value]) => {
        if (!value) params.delete(key);
      });

      const response = await axiosMerchant.post(`ofd?${params.toString()}`);
      setShipments(response.data.data.data.data || []);
      setLinks(response.data.data.links || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      setBtnLoading(false);
    }
  }, [search, driverValue, merchantValue, paymentTypeValue, exceptionValue, ofdValue, dateRange, itemsPerPage]);

  useEffect(() => {
    if (!drivers) dispatch(getDrivers());
    if (!merchants) dispatch(getMerchants());
    if (!systemDeliveryExceptions) dispatch(getSystemDeliveryExceptions());
  }, [dispatch, drivers, merchants, systemDeliveryExceptions]);

  useEffect(() => {
    fetchOFD(currentPage);
  }, [
    currentPage,
    search,
    driverValue,
    merchantValue,
    paymentTypeValue,
    exceptionValue,
    ofdValue,
    dateRange,
    fetchOFD,
  ]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRefresh = () => {
    setSearch("");
    setDriverValue(null);
    setMerchantValue(null);
    setPaymentTypeValue(null);
    setExceptionValue(null);
    setOfdValue("");
    setDateRange({
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
    });
    setCurrentPage(1);
    setItemsPerPage(10);
  };

  const navigate = useNavigate();

  const canAccess = can("OFD List access");

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  const handleDateRangeChange = (key, value) => setDateRange((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex flex-col gap-4 mt-2">
        <PageTitle title={t("OFD List")} />

        {/* Filter Card */}
        <div className="bg-white dark:bg-muted shadow-md rounded-lg p-4 flex flex-col gap-y-4">
          <div className="mb-2 flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t("Filter OFD Shipments")}</h2>
            <Button type="button" variant="refresh" onClick={handleRefresh} disabled={btnLoading}>
              {btnLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Search Field */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="search">{t("Search")}</Label>
              <Input
                id="search"
                type="text"
                className="w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("Search by Tracking No...")}
              />
            </div>

            {/* Driver Filter */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="driver">{t("Driver")}</Label>
              <Select
                name="driver"
                placeholder={t("Select driver...")}
                options={drivers?.map((driver) => ({
                  label: driver.name,
                  value: driver.id,
                }))}
                value={driverValue}
                onChange={(e) => setDriverValue(e)}
                isClearable
              />
            </div>

            {/* Merchant Filter */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="merchant">{t("Merchant")}</Label>
              <Select
                name="merchant"
                placeholder={t("Select merchant...")}
                options={merchants?.map((merchant) => ({
                  label: merchant.name,
                  value: merchant.id,
                }))}
                value={merchantValue}
                onChange={(e) => setMerchantValue(e)}
                isClearable
              />
            </div>

            {/* Payment Type Filter */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="paymentType">{t("Payment Type")}</Label>
              <Select
                name="payment_type"
                placeholder={t("Select payment type...")}
                options={[
                  { value: "paid", label: t("Paid") },
                  { value: "cod", label: t("COD") },
                ]}
                value={paymentTypeValue}
                onChange={(value) => setPaymentTypeValue(value)}
                isClearable
              />
            </div>

            {/* Delivery Exceptions Filter */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="deliveryException">{t("Delivery Exceptions")}</Label>
              <Select
                name="systemDeliveryException"
                placeholder={t("Select exception...")}
                options={systemDeliveryExceptions?.map((sysExc) => ({
                  label: sysExc.label,
                  value: sysExc.name,
                }))}
                value={exceptionValue}
                onChange={(e) => setExceptionValue(e)}
                isClearable
              />
            </div>

            {/* OFD Times Filter */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="ofdTimes">{t("OFD Times")}</Label>
              <Input
                id="ofdTimes"
                type="number"
                className="w-full"
                value={ofdValue}
                onChange={e => setOfdValue(e.target.value)}
                placeholder={t("Enter OFD times...")}
              />
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-1 input-container md:col-span-2">
              <Label htmlFor="dateRange">{t("OFD Date Range")}</Label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <DateTimeRangePicker
                  filters={{
                    from: dateRange.from,
                    to: dateRange.to,
                    from_time: dateRange.from_time,
                    to_time: dateRange.to_time,
                  }}
                  onChange={handleDateRangeChange}
                  t={t}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="ofdTimes">{t("Show")}</Label>
              <Select
                className="w-20"
                value={{ value: itemsPerPage, label: itemsPerPage }}
                onChange={(selected) => {
                  setItemsPerPage(selected.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 5, label: '5' },
                  { value: 8, label: '8' },
                  { value: 10, label: '10' },
                  { value: 15, label: '15' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                ]}
              />
            </div>
          </div>
        </div>
        {/* End Filter Card */}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t("OFD List")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Tracking no")}</TableHead>
                  <TableHead>{t("governorate")}</TableHead>
                  <TableHead>{t("State")}</TableHead>
                  <TableHead>{t("Place")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : shipments && shipments.length > 0 ? (
                  shipments.map((shipment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-center">{index + 1}</TableCell>
                      <TableCell className="text-center">{shipment.tracking_no}</TableCell>
                      <TableCell className="text-center">{language === 'en' ? shipment?.consignee?.governorate?.en_name : shipment?.consignee?.governorate?.ar_name}</TableCell>
                      <TableCell className="text-center">{language === 'en' ? shipment?.consignee?.state?.en_name : shipment?.consignee?.state?.ar_name}</TableCell>
                      <TableCell className="text-center">{language === 'en' ? shipment?.consignee?.place?.en_name : shipment?.consignee?.place?.ar_name}</TableCell>
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
        </CardContent >
      </Card >
    </div >
  );
}

export default OFDList;
