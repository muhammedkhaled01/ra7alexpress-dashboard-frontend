import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useNavigate, useParams } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
import { DollarSign, Loader2, Package, Sheet, Truck } from "lucide-react";
import { can, formatCurrency, humanizeText } from "@/utils/helpers";
import { StatBox } from "@/components/misc/StatBox";
import { useDispatch, useSelector } from "react-redux";
import { getAccountables } from "@/stores/features/ajaxFeature";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageProvider";

function ShipperAccounts() {
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [btnLoading, setBtnLoading] = useState(false);
  // const [merchants, setShipments] = useState(null)
  // const [merchantCount, setShipmentCount] = useState(null)
  const [merchant, setMerchant] = useState(null)
  const params = useParams()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const accountables = useSelector(store => store.ajax.accountables)
  useEffect(() => {
    axiosMerchant.get("accounts/shipper/" + params.id).then((response) => {
      setMerchant(response.data.data)
      setLoading(false)
    });

    if (!accountables) dispatch(getAccountables())
  }, [])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleExport = async () => {
    setBtnLoading(true)
    try {
      const response = await axiosMerchant.get(`accounts/export/shipper/${params.id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', 'account.csv');
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t("Account downloaded successfully."))
    } catch (error) {
      console.error('Download failed:', error);
      handleError(error)
    } finally {
      setBtnLoading(false)
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Account access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>
            <div className="flex flex-row justify-between">
              <p>{merchant?.name ? `${merchant?.name} -` : ""} {t("Account")}</p>
              {/* <Button disabled={btnLoading} onClick={() => handleExport(merchant)}>
                {btnLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Sheet /> {t("Export")}</>
                )}

              </Button> */}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {/* COD Section */}
              {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">COD Balance</span>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(merchant?.ra7al_value || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Total COD</span>
                  <span className="text-2xl font-semibold">
                    {formatCurrency(merchant?.cod_total || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">COD Collected</span>
                  <span className="text-2xl font-semibold text-green-600">
                    {formatCurrency(merchant?.cod_collected || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">COD Pending</span>
                  <span className="text-2xl font-semibold text-amber-600">
                    {formatCurrency(merchant?.cod_pending || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                  </span>
                </div>
              </div> */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox
                  label={t("Ra7al Value")}
                  value={merchant?.ra7al_value || '0'}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <StatBox
                  label={t("Cash Balance")}
                  value={merchant?.cash_balance || '0'}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <StatBox
                  label={t("Pending Pickups")}
                  value={merchant?.pending_pickups?.toLocaleString() || '0'}
                  className="text-amber-600"
                />
              </div>

              {/* Shipment Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox
                  label={t("Total Shipments")}
                  value={merchant?.total_shipments?.toLocaleString() || '0'}
                  icon={<Package className="h-4 w-4" />}
                />
                <StatBox
                  label={t("Delivered")}
                  value={merchant?.delivered_count?.toLocaleString() || '0'}
                  className="text-green-600"
                />
                <StatBox
                  label={t("In Transit")}
                  value={merchant?.in_transit_count?.toLocaleString() || '0'}
                  className="text-blue-600"
                />
                <StatBox
                  label={t("Failed Attempts")}
                  value={merchant?.failed_attempts?.toLocaleString() || '0'}
                  className="text-red-600"
                />
              </div>
            </CardContent>
          </Card>


          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* From Transactions */}
            <Card className="">
              <CardHeader>
                <div className="flex flex-row space-x-3">
                  <CardTitle className="self-center">
                    {t("Sent Transactions")}{merchant?.sent_transactions_count ? ` (${merchant?.sent_transactions_count})` : ""}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("From")}</TableHead>
                      <TableHead>{t("To")}</TableHead>
                      <TableHead>{t("Amount")}</TableHead>
                      <TableHead>{t("Type")}</TableHead>
                      <TableHead>{t("Time")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchant?.sent_transactions && merchant?.sent_transactions?.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{transaction.from?.name ?? "-"}</TableCell>
                        <TableCell>{transaction.to?.name ?? "-"}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>{humanizeText(transaction.type)}</TableCell>
                        <TableCell>{new Date(transaction.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {/* To Transactions */}
            <Card className="">
              <CardHeader>
                <div className="flex flex-row space-x-3">
                  <CardTitle className="self-center">
                    {t("Received Transactions")}{merchant?.received_transactions_count ? ` (${merchant?.received_transactions_count})` : ""}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("From")}</TableHead>
                      <TableHead>{t("To")}</TableHead>
                      <TableHead>{t("Amount")}</TableHead>
                      <TableHead>{t("Type")}</TableHead>
                      <TableHead>{t("Time")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchant?.received_transactions && merchant?.received_transactions?.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{transaction.from?.name ?? "-"}</TableCell>
                        <TableCell>{transaction.to?.name ?? "-"}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>{humanizeText(transaction.type)}</TableCell>
                        <TableCell>{new Date(transaction.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

export default ShipperAccounts;