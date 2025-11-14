import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { Link, useParams } from "react-router-dom";

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
import { Button } from "@/components/ui/button";
import { Eye, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { capitalize } from "@/utils/helpers";
import Status from "./Status";

function FinanceMerchantInvoicePending() {
  const [selectedRecord, setselectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState(null);
  const [merchants, setMerchants] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);

  const params = useParams()
  const { t } = useTranslation()

  useEffect(() => {
    fetchMerchants()
    fetchInvoice()
  }, [])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const fetchMerchants = () => {
    axiosMerchant.get("invoices/merchants/pending").then((response) => {
      setMerchants(response.data.data)
      console.log(response.data.data)
      setLoading(false)
    });
  }

  const fetchInvoice = (merchant) => {
    setMerchant(merchant)
    setLoading(true)
    const merchant_id = merchant?.invoiceable_id ?? ""
    axiosMerchant.get("invoices/pending/" + merchant_id).then((response) => {
      setInvoices(response.data.data.data)
      setLoading(false)
    });
  }

  const handleSubmitSuccess = () => {
    fetchInvoice();
  };

  const handleStatusDialog = () => {
    fetchInvoice();
  };

  // DIALOG STATUS
  const openStatusDialog = (record) => {
    setselectedRecord(record);
    setStatusDialog(true);
  };

  const closeStatusDialog = () => {
    setselectedRecord(null);
    setStatusDialog(false);
  };

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
      {/* Merchants */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t("Merchants")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {merchants && merchants?.map((merchant, index) => (
                <TableRow key={index}>
                  <TableHead style={{ cursor: "pointer" }} onClick={() => fetchInvoice(merchant)}>{merchant?.invoiceable?.name}</TableHead>
                </TableRow>
              ))}
            </TableHeader>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice */}
      <Card className="col-span-10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t("Pending Invoices")}</CardTitle>
            <Button type="button" variant="refresh" onClick={async () => {
              setLoading(true);
              await fetchInvoice();
              setLoading(false);
            }}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead isFixed>{t("Invoice no")}</TableHead>
                  <TableHead>{t("Total Amount")}</TableHead>
                  <TableHead>{t("View")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
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
                    const total = invoice.invoice_shipments
                      .reduce((sum, shipment) => sum + parseFloat(shipment.shipment.amount), 0);
                    return <TableRow key={index}>
                      <TableCell isFixed>{invoice.id}</TableCell>
                      <TableCell>{total}</TableCell>
                      <TableCell>
                        <Link to={"/merchants/invoices/" + invoice.invoiceable_id}>
                          <Button
                            size="icon"
                            className="ml-1"
                            variant="default"
                          >
                            <Eye className="h-6 w-6" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Badge
                          variant="outline"
                          className="hover:cursor-pointer"
                          onClick={() => openStatusDialog(invoice)}
                        >
                          {capitalize(invoice.status)}{" "}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="destructive">Hold</Button>
                      </TableCell>
                    </TableRow>
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
      {statusDialog && (
        <Status
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeStatusDialog}
        />
      )}
    </div >
  );
}

export default FinanceMerchantInvoicePending;