import React, { useEffect, useState, useCallback } from "react";
import axiosMerchant from "@/axios";
import { Link, useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import Pagination from "@/components/Pagination";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Eye, Download, RefreshCcw } from "lucide-react";
import { can, formatCurrency, humanizeText } from "@/utils/helpers";
import ExportDialog from "@/components/misc/ExportDialog";
import SalaryBillManagementFilters from "@/components/admin/Finance/SalaryBillManagementFilters";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useSelector } from "react-redux";

function FinanceDriverInvoiceCompleted() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const { language } = useLanguage();
  const { currencyEnglishName, currencyArabicName, decimalPrecision } = useSelector((state) => state.setting);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    company: '',
    hub: '',
    driver: '',
    dateFrom: '',
    dateTo: ''
  });

  const { t } = useTranslation();
  const navigate = useNavigate();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("/driver_invoices/completed", {
        params: {
          page: currentPage,
          status: filters.status,
          company: filters.company,
          hub: filters.hub,
          driver: filters.driver,
          search: searchTerm,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
      });
      setInvoices(response.data.data.data);
      setLinks(response.data.data.links);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching completed invoices:", error);
      setLoading(false);
    }
  }, [currentPage, filters, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInvoices();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters, fetchInvoices]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setRefreshBtn(false);
    setFilters({
      status: '',
      company: '',
      hub: '',
      driver: '',
      dateFrom: '',
      dateTo: ''
    });
    fetchInvoices();
  };

  const handleSubmitSuccess = () => {
    fetchInvoices();
  };

  const canAccess = can("Account access") || can("Invoice access");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 mt-2">
        <SalaryBillManagementFilters
          searchTerm={searchTerm}
          filters={filters}
          setFilters={setFilters}
          onSearchTermChange={setSearchTerm}
          onReset={(e) => {
            e.stopPropagation();
            setFilters({
              status: '',
              company: '',
              hub: '',
              driver: '',
              dateFrom: '',
              dateTo: ''
            });
            setSearchTerm('');
            fetchInvoices();
          }}
          onSearchSubmit={fetchInvoices}
        />
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <Button type="button" variant="refresh" onClick={handleRefresh}>
          <RefreshCcw className="w-4 h-4" />
        </Button>
        <Button variant="download" type="button" onClick={() => setShowExport(true)}>
          <Download className="w-4 h-4" />
          {t("Export")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("Completed Driver Invoices Report")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="shadow-md py-4 mt-2 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Invoice No")}</TableHead>
                    <TableHead isFixed>{t("Invoice Date")}</TableHead>
                    <TableHead>{t("Hub")}</TableHead>
                    <TableHead>{t("Company")}</TableHead>
                    <TableHead>{t("Driver")}</TableHead>
                    <TableHead>{t("Runsheet")}</TableHead>
                    <TableHead>{t("Total Shipments")}</TableHead>
                    <TableHead>{t("Total Amount")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Payment Date")}</TableHead>
                    <TableHead>{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center">
                        <Loader />
                      </TableCell>
                    </TableRow>
                  ) : invoices && invoices.length > 0 ? (
                    invoices.map((invoice, index) => {
                      // Calculate total amount from invoice shipments
                      const totalAmount = invoice.invoice_shipments?.reduce((sum, io) => {
                        const fee = parseFloat(io.shipment?.shipment_finance?.driver_delivery_fee || 0);
                        return sum + fee;
                      }, 0) || 0;

                      // Calculate total shipments count
                      const totalShipments = invoice.invoice_shipments?.length || 0;

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoice_no || `INV-${invoice.id}`}
                          </TableCell>
                          <TableCell isFixed>
                            {invoice.created_at
                              ? new Date(invoice.created_at).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                              : '-'}
                          </TableCell>
                          <TableCell>{invoice.owner?.name || '-'}</TableCell>
                          <TableCell>{invoice.invoiceable?.driver?.company?.name || '-'}</TableCell>
                          <TableCell>{invoice.invoiceable?.name || '-'}</TableCell>
                          <TableCell>{invoice.runsheet?.id || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {totalShipments} {t("Shipments")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {totalAmount > 0
                              ? formatCurrency(totalAmount, language, decimalPrecision, currencyEnglishName, currencyArabicName)
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "Paid" ? "default" :
                                  invoice.status === "Completed" ? "secondary" : "destructive"
                              }
                            >
                              {invoice.status && humanizeText(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invoice.paid_at
                              ? new Date(invoice.paid_at).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-x-2">
                              <Link to={`/salary-bill-details/${invoice.id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title={t("View Details")}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center">
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

        {showExport && (
          <ExportDialog
            model="completed_driver_invoices"
            endpoint="driver_invoices/export/completed"
            fields={[
              { key: "id", label: "ID" },
              { key: "invoice_no", label: "Invoice No" },
              { key: "created_at", label: "Invoice Date" },
              { key: "owner.name", label: "Hub" },
              { key: "invoiceable.driver.company.name", label: "Company" },
              { key: "invoiceable.name", label: "Driver" },
              { key: "runsheet.id", label: "Runsheet ID" },
              { key: "total_shipments", label: "Total Shipments" },
              { key: "total_amount", label: "Total Amount" },
              { key: "status", label: "Status" },
              { key: "paid_at", label: "Payment Date" },
              { key: "updated_at", label: "Updated At" }
            ]}
            onClose={() => setShowExport(false)}
          />
        )}
      </div>
    </>
  );
}

export default FinanceDriverInvoiceCompleted;