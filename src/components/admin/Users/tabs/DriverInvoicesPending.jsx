import { useEffect, useState, useCallback } from "react";
import axiosMerchant from "@/axios";
import { Link, useParams } from "react-router-dom";

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
import {
  Loader2,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleError, humanizeText, printInvoice } from "@/utils/helpers";
import DeleteAlert from "@/components/misc/DeleteAlert";
import ExportDialog from "@/components/misc/ExportDialog";
import SalaryBillDetails from "@/components/admin/Finance/SalaryBillDetails";

function DriverInvoicesPending() {
  const [loading, setLoading] = useState(false);
  const [links] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [driver, setDriver] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [invoiceShipments, setInvoiceShipments] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    hub: '',
    company: '',
    statementDateFrom: '',
    statementDateTo: '',
    createTimeFrom: '',
    createTimeTo: ''
  });

  const [hubs, setHubs] = useState([]);
  const [companies, setCompanies] = useState([]);

  const params = useParams();
  const { t } = useTranslation();

  const fetchData = useCallback(() => {
    setLoading(true);
    axiosMerchant.get(`driver_invoices/invoice_details/${params.id || ''}`, {
      params: {
        ...filters,
        searchTerm: searchTerm
      }
    })
      .then((response) => {
        setDriver(response.data?.data?.invoiceable || null);
        setInvoice(response.data?.data || null);
        const filteredInvoiceShipments = searchTerm
          ? (response.data?.data?.invoice_shipments || []).filter(shipment =>
            shipment?.invoice?.id.toString().includes(searchTerm)
          )
          : response.data?.data?.invoice_shipments || [];
        setInvoiceShipments(filteredInvoiceShipments);
      })
      .catch(() => {
        setDriver(null);
        setInvoice(null);
        setInvoiceShipments([]);
      })
      .finally(() => setLoading(false));
  }, [params.id, filters, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      hub: '',
      company: '',
      statementDateFrom: '',
      statementDateTo: '',
      createTimeFrom: '',
      createTimeTo: ''
    });
  };

  const fetchHubs = useCallback(async () => {
    try {
      const response = await axiosMerchant.get('hubs');
      setHubs(response.data.data.data);
    } catch (error) {
      console.error('Error fetching hubs:', error);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await axiosMerchant.get('companies');
      setCompanies(response.data.data.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  }, []);

  useEffect(() => {
    fetchHubs();
    fetchCompanies();
  }, [])

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrint = async (id) => {
    try {
      setIsPrinting(true);
      const response = await axiosMerchant.get(
        `invoices/print_pending_driver_invoice/${id || ''}`
      );
      printInvoice(response.data?.html || '');
    } catch (error) {
      console.error("Error fetching invoice data for printing:", error);
      handleError(error);
    } finally {
      setIsPrinting(false);
    }
  };
  const closeDeleteAlert = () => {
    setSelectedRecord(null);
    setDeleteAlert(false);
  };

  const handleSubmitSuccess = () => {
    fetchData();
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 mt-2">
        <SalaryBillDetails
          searchTerm={searchTerm}
          filters={filters}
          hubs={hubs}
          companies={companies}
          onSearchTermChange={setSearchTerm}
          onFiltersChange={setFilters}
          onReset={handleRefresh}
        />
      </div>

      <Card className="">
        <CardHeader>
          <div className="flex flex-row justify-between">
            <CardTitle>{`${t("Salary Bill Details")} ${driver?.name || ''} `}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="print" disabled={isPrinting} onClick={() => handlePrint(driver?.id || '')}>
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Statement ID")}</TableHead>
                  <TableHead>{t("Statement No")}</TableHead>
                  <TableHead>{t("Statement Date")}</TableHead>
                  <TableHead>{t("Hub")}</TableHead>
                  <TableHead>{t("Employee")}</TableHead>
                  <TableHead>{t("Account")}</TableHead>
                  <TableHead>{t("Company")}</TableHead>
                  <TableHead>{t("Manifest")}</TableHead>
                  <TableHead>{t("Fee Type")}</TableHead>
                  {/* <TableHead>{t("Account Calculations")}</TableHead> */}
                  <TableHead>{t("Status")}</TableHead>
                  {/* <TableHead>{t("Actions")}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : invoiceShipments && invoiceShipments.length > 0 ? (
                  invoiceShipments?.map((shipment, index) => (
                    <TableRow key={index}>
                      <TableCell>{shipment?.invoice?.id}</TableCell>
                      <TableCell>{shipment?.invoice?.invoice_no || '-'}</TableCell>
                      <TableCell>
                        {shipment?.invoice?.runsheet?.created_at
                          ? new Date(shipment?.invoice?.runsheet?.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{shipment?.invoice?.owner?.name || '-'}</TableCell>
                      <TableCell>{shipment?.employee?.name || '-'}</TableCell>
                      <TableCell>{shipment?.invoice?.runsheet?.submission?.received_by?.name || '-'}</TableCell>
                      <TableCell>{shipment?.invoice?.invoiceable?.driver?.company?.name || '-'}</TableCell>
                      <TableCell>
                        <Link to={`/driver-runsheet?id=${shipment?.invoice?.runsheet?.id}`}>
                          {shipment?.invoice?.runsheet?.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {t("Delivery Fee: ")}{shipment?.shipment_finance?.driver_delivery_fee || '-'}<br />
                        {t("Delivery Bonus: ")}{shipment?.shipment_finance?.driver_delivery_bonus || '-'}
                      </TableCell>
                      {/* <TableCell>{shipment?.calculation || '-'}</TableCell> */}
                      <TableCell>
                        <Badge
                          variant={(shipment?.status === 'Paid') ? 'default' : 'destructive'}
                        >
                          {humanizeText(shipment?.status) || '-'}
                        </Badge>
                      </TableCell>
                      {/* <TableCell>
                        <Button
                          onClick={() => openDeleteAlert(shipment || {})}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell> */}
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

      {deleteAlert && selectedRecord && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord || {}}
          onClose={closeDeleteAlert}
          api={"invoices/shipments/delete"}
        />
      )}

      {showExport && (
        <ExportDialog
          model="driver_invoices"
          endpoint="invoices/export/pending"
          fields={[
            { key: "invoice_id", label: "Statement ID" },
            { key: "invoice_no", label: "Statement No" },
            { key: "statement_date", label: "Statement Date" },
            { key: "runsheet.id", label: "Manifest" },
            { key: "owner.name", label: "Hub" },
            // { key: "employee", label: "Employee" },
            // { key: "driver", label: "Driver" },
            { key: "invoiceable.driver.company", label: "Company" },
            // { key: "fee_type", label: "Fee Type" },
            // { key: "calculation", label: "Account Calculations" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" }
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

export default DriverInvoicesPending;