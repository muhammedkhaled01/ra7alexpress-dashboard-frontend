import { useEffect, useState, useCallback } from "react";
import axiosMerchant from "@/axios";
import { Link, Navigate, redirect, useNavigate, useParams, useLocation } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SalaryBillManagementFilters from "@/components/admin/Finance/SalaryBillManagementFilters";

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
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Container, Eye, Loader2 } from "lucide-react";
import DeleteAlert from "@/components/misc/DeleteAlert";
import ExportDialog from "@/components/misc/ExportDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";
import { can, humanizeText } from "@/utils/helpers";
import ConfirmInvoiceDialog from "./ConfirmInvoiceDialog";

function FinanceDriverInvoicePending() {
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [invoicesWithCheckbox, setInvoicesWithCheckbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [btnLoading, setBtnLoading] = useState({
    exportBtn: false
  });
  const [filters, setFilters] = useState({
    status: '',
    company: '',
    hub: '',
    driver: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showExport, setShowExport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.driver_id) {
      setFilters(prev => ({
        ...prev,
        driver: location.state.driver_id
      }));
    }
  }, [location.state]);

  // const fetchDrivers = useCallback(async () => {
  //   try {
  //     await axiosMerchant.get("/drivers");
  //   } catch (error) {
  //     console.error("Error fetching drivers:", error);
  //   }
  // }, []);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("/driver_invoices/", {
        params: {
          page: currentPage,
          status: filters.status,
          company: filters.company,
          hub: filters.hub,
          driver: filters.driver,
          search: searchTerm,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          itemsPerPage: itemsPerPage,
        },
      });
      setInvoices(response.data.data.data);
      setLinks(response.data.data.links);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setLoading(false);
    }
  }, [currentPage, filters, searchTerm, itemsPerPage]);

  useEffect(() => {
    if (invoices) {
      setInvoicesWithCheckbox(invoices.map(invoice => ({
        ...invoice,
        checked: selectedRows.includes(invoice.id)
      })));
    }
  }, [invoices, selectedRows]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInvoice();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters, fetchInvoice]);


  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };


  const handleSubmitSuccess = () => {
    fetchInvoice();
  };


  const closeDeleteAlert = () => {
    setDeleteAlert(false);
  };

  const handleDelete = useCallback(async () => {
    try {
      const response = await axiosMerchant.post("/invoices/bulk_delete", {
        invoice_ids: selectedRows
      });
      toast.success(response.data.message);
      fetchInvoice();
      setSelectedRows([]);
      closeDeleteAlert();
    } catch (error) {
      console.error("Error deleting invoices:", error);
      toast.error(t("Error deleting invoices"));
    }
  }, [fetchInvoice, selectedRows, t]);


  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const updatedInvoices = invoices.map(invoice => ({
      ...invoice,
      checked: newSelectAll
    }));
    setInvoicesWithCheckbox(updatedInvoices);

    const updatedSelectedRows = newSelectAll
      ? updatedInvoices.map(invoice => invoice.id)
      : [];
    setSelectedRows(updatedSelectedRows);
  };

  const handleInvoiceCheckboxChange = (invoiceId) => {
    const updatedInvoices = invoicesWithCheckbox.map(invoice =>
      invoice.id === invoiceId ? { ...invoice, checked: !invoice.checked } : invoice
    );
    setInvoicesWithCheckbox(updatedInvoices);

    const updatedSelectedRows = updatedInvoices
      .filter(invoice => invoice.checked)
      .map(invoice => invoice.id);
    setSelectedRows(updatedSelectedRows);
    setSelectAll(updatedSelectedRows.length === invoices.length);
  };

  const bulkPayInvoices = async () => {
    setBtnLoading(true);
    try {
      const response = await axiosMerchant.post("/invoices/bulk_pay", {
        invoice_ids: selectedRows,
      });
      toast.success(response.data.message);

      setSelectedRows([]);
      setSelectAll(false);
      fetchInvoice();
    } catch (error) {
      console.error('Error paying invoices:', error);
      toast.error(t('Error paying invoices'));
    } finally {
      setBtnLoading(false);
    }
  };

  const updateInvoiceStatus = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.target);
    const selectedStatus = formData.get("status");

    try {
      const response = await axiosMerchant.post("/invoices/change_status", {
        invoice_ids: selectedRows,
        status: selectedStatus,
      });
      toast.success(response.data.message);

      setSelectedRows([]);
      setSelectAll(false);
      fetchInvoice();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error(t('Error updating invoice status'));
    } finally {
      setIsLoading(false);
    }
  };

  const canAccess = can("Account access") || can("Invoice access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }


  return (
    <>
      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between bg-white dark:bg-gray-800 shadow rounded p-4 mb-4">
          <div className="flex items-center gap-x-2">
            <form
              onSubmit={updateInvoiceStatus}
              className="flex items-center gap-x-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Label>{t("Invoice Status")}</Label>
              <Select
                name="status"
                value={filters.status}
                onValueChange={(value) => {
                  const form = document.createElement('form');
                  const statusInput = document.createElement('input');
                  statusInput.name = 'status';
                  statusInput.value = value;
                  form.appendChild(statusInput);
                  updateInvoiceStatus({ preventDefault: () => { }, target: form });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">{t('Paid')}</SelectItem>
                  <SelectItem value="Unpaid">{t('Unpaid')}</SelectItem>
                </SelectContent>
              </Select>
            </form>
            <div className="ml-2 text-sm text-muted-foreground">
              {t('Selected')}: {selectedRows.length} {t('Invoices')}
            </div>
            <div className="ml-2">
              {selectedRows.length === 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button type="button" disabled>
                        {t("Bulk Pay")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>{t('Select invoices to pay')}</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  type="button"
                  onClick={bulkPayInvoices}
                  disabled={btnLoading}
                >
                  {btnLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("Bulk Pay")
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mt-2">
        <SalaryBillManagementFilters
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
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
            fetchInvoice();
          }}
          onSearchSubmit={fetchInvoice}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 mt-2">

        {/* Invoice */}
        <Card className="col-span-10">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <CardTitle>{t("Pending Salary Bill Management")}</CardTitle>
              <Button
                type="button"
                onClick={() => setShowExport(true)}
                disabled={btnLoading.exportBtn} variant="export"
              >
                {btnLoading.exportBtn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Container />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="shadow-md py-4 mt-2 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{t("Statement ID")}</TableHead>
                    <TableHead isFixed>{t("Statement Date")}</TableHead>
                    <TableHead>{t("Hub")}</TableHead>
                    <TableHead>{t("Company")}</TableHead>
                    <TableHead>{t("Driver")}</TableHead>
                    <TableHead>{t("Runsheet")}</TableHead>
                    {/* <TableHead>{t("Fee Type")}</TableHead> */}
                    {/* <TableHead>{t("Calculation")}</TableHead> */}
                    <TableHead>{t("Amount")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center">
                        <Loader />
                      </TableCell>
                    </TableRow>
                  ) : invoicesWithCheckbox && invoicesWithCheckbox.length > 0 ? (
                    invoicesWithCheckbox.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectAll || invoice.checked}
                            onCheckedChange={() => handleInvoiceCheckboxChange(invoice.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.invoice_no || '-'}
                        </TableCell>
                        <TableCell isFixed className="font-medium">
                          {invoice.created_at
                            ? new Date(invoice.created_at).toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                            : '-'}
                          <div className="flex justify-center gap-x-2 mt-2">
                            <Link to={`/salary-bill-details/${invoice?.id}`}>
                              <Button size="sm" variant="secondary">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {invoice?.status == "pending" && (
                              <ConfirmInvoiceDialog invoice={invoice} onSubmitSuccess={handleSubmitSuccess} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{invoice.owner?.name || '-'}</TableCell>
                        <TableCell>{invoice.invoiceable?.driver?.company?.name || '-'}</TableCell>
                        <TableCell>{invoice.invoiceable?.name || '-'}</TableCell>
                        <TableCell>{invoice.runsheet?.id || '-'}</TableCell>
                        {/* <TableCell>{invoice.fee_type || '-'}</TableCell> */}
                        {/* <TableCell>{invoice.calculation || '-'}</TableCell> */}
                        <TableCell>{invoice.driver_total_commission || '-'}</TableCell>
                        {/* <TableCell className="text-right font-semibold">
                          {invoice.total_amount
                            ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(invoice.total_amount)
                            : '-'}
                        </TableCell> */}
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === "Paid" ? "default" : "destructive"
                            }
                          >
                            {invoice.status && humanizeText(invoice.status)}
                          </Badge>
                        </TableCell>
                        {/* <TableCell className="text-right flex justify-end gap-2"> */}
                        {/* </TableCell> */}
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
              <Pagination
                links={links}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </div>
          </CardContent>
        </Card>

        {
          deleteAlert && (
            <DeleteAlert
              onSubmitSuccess={handleSubmitSuccess}
              record={selectedRows.length === 1 ? invoices?.find(invoice => invoice.id === selectedRows[0]) : null}
              onClose={closeDeleteAlert}
              onConfirm={handleDelete}
              api={'invoices/bulk_delete'}
              message={`Are you sure you want to delete ${selectedRows.length} invoice(s)?`}
            />
          )
        }

        {
          showExport && (
            <ExportDialog
              model="driver_invoices"
              endpoint="invoices/export"
              additionalData={{
                company: filters.company || '',
                hub: filters.hub || '',
                driver: filters.driver || '',
                dateFrom: filters.dateFrom || '',
                dateTo: filters.dateTo || ''
              }}
              fields={[
                { key: "id", label: t('Invoice ID') },
                { key: "invoice_no", label: t('Statement ID') },
                { key: "statement_date", label: t('Statement Date') },
                { key: "statement_time", label: t('Statement Time') },
                { key: "hub", label: t('Hub') },
                { key: "company", label: t('Company') },
                { key: "driver", label: t('Driver Name') },
                { key: "driver_phone", label: t('Driver Phone') },
                { key: "runsheet_id", label: t('Runsheet ID') },
                { key: "amount", label: t('Commission Amount') },
                { key: "total_amount", label: t('Total Amount') },
                { key: "paid_to_driver", label: t('Paid to Driver') },
                { key: "status", label: t('Status') },
                { key: "fee_type", label: t('Fee Type') },
                { key: "calculation", label: t('Calculation') },
                { key: "created_at", label: t('Created At') },
                { key: "updated_at", label: t('Updated At') }
              ]}
              onClose={() => setShowExport(false)}
              onExport={() => setBtnLoading({ ...btnLoading, exportBtn: true })}
              onExportSuccess={() => setBtnLoading({ ...btnLoading, exportBtn: false })}
            />
          )
        }
      </div >
    </>
  );
}

export default FinanceDriverInvoicePending;