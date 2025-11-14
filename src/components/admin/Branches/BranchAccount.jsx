import React, { useEffect, useState } from "react";
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
import { ClipboardList, Package, Star, Truck, UserRound, Users } from "lucide-react";
import { can, formatCurrency, formatTime, isAuthorized } from "@/utils/helpers";
import { StatBox } from "@/components/misc/StatBox";
import axiosMerchant from "@/axios";
import { useLanguage } from "@/contexts/LanguageProvider";
import {useSelector} from "react-redux";

function BranchAccounts() {
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [branch, setBranch] = useState(null)
  const params = useParams()
  const { t } = useTranslation()

  useEffect(() => {
    axiosMerchant.get("accounts/branch/" + params.id).then((response) => {
      setBranch(response.data.data.data)
      setLoading(false)
    });
  }, [])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const navigate = useNavigate()

  const canAccess = can("Account access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }


  return (
    <div>
      <Card className="">
        <CardHeader></CardHeader>
        <CardContent>
          <Card className="h-full">
            <CardHeader>
              <div className="flex flex-row justify-between items-center">
                <CardTitle>{branch?.name ? `branch?.name -` : ""} {t("Account")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatBox
                  label={t("Total Shipments")}
                  value={branch?.total_shipments?.toLocaleString() || '0'}
                  icon={<Truck className="h-4 w-4" />}
                />
                <StatBox
                  label={t("Delivery Success Rate")}
                  value={branch?.success_rate ? `${branch.success_rate}%` : 'N/A'}
                  className="text-green-600"
                />
                <StatBox
                  label={t("Workforce")}
                  value={branch?.total_staff?.toLocaleString() || '0'}
                  icon={<Users className="h-4 w-4" />}
                />
              </div>

              {/* Financials */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">{t("Monthly Revenue")}</span>
                  <span className="text-xl font-semibold">
                    {formatCurrency(branch?.monthly_revenue || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">{t("OPEX")}</span>
                  <span className="text-xl font-semibold text-rose-600">
                    {formatCurrency(branch?.operational_costs || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">{t("Vehicle Fleet")}</span>
                  <span className="text-xl font-semibold">
                    {branch?.vehicles_count?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">{t("Utilization Rate")}</span>
                  <span className="text-xl font-semibold">
                    {branch?.utilization_rate ? `${branch.utilization_rate}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Operational Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">{t("Avg. Processing Time")}</span>
                  <span className="text-xl font-semibold">
                    {formatTime(branch?.avg_processing_time)}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">{t("Peak Capacity")}</span>
                  <span className="text-xl font-semibold">
                    {branch?.peak_capacity?.toLocaleString() || '0'}/{t("hr")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>


          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* From Transactions */}
            <Card className="">
              <CardHeader>
                <div className="flex flex-row space-x-3">
                  <CardTitle className="self-center">
                    {`${t("From Transactions")} ${branch?.sent_transactions_count ? `(${branch?.sent_transactions_count})` : ""}`}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branch?.sent_transactions && branch?.sent_transactions?.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{transaction.from?.name ?? "-"}</TableCell>
                        <TableCell>{transaction.to?.name ?? "-"}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>{humanizeText(transaction.type)}</TableCell>
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
                    {`${t("To Transactions")} ${branch?.to_transactions_count ? `(${branch?.to_transactions_count})` : ""}`}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branch?.to_transactions && branch?.to_transactions?.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{transaction.from?.name ?? "-"}</TableCell>
                        <TableCell>{transaction.to?.name ?? "-"}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>{humanizeText(transaction.type)}</TableCell>
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

export default BranchAccounts;