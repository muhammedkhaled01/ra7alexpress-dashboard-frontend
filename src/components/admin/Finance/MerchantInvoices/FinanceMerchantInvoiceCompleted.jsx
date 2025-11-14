import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useParams } from "react-router-dom";
import { RefreshCcw } from "lucide-react";

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

function FinanceDriverInvoicePending() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState(null);
  const [drivers, setDrivers] = useState(null);
  const [driver, setDriver] = useState(null);

  const params = useParams()
  const { t } = useTranslation()

  useEffect(() => {
    fetchDrivers()
    fetchCOD()
  }, [])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const fetchDrivers = () => {
    axiosMerchant.get("cod_collection/drivers/pending").then((response) => {
      setDrivers(response.data.data)
      console.log(response.data.data)
      setLoading(false)
    });
  }

  const fetchCOD = (driver) => {
    setDriver(driver)
    setLoading(true)
    const driver_id = driver?.id ?? ""
    axiosMerchant.get("cod_collection/pending/" + driver_id).then((response) => {
      setInvoices(response.data.data.data)
      setInvoiceCount(response.data.success.count)
      setLoading(false)
    });
  }

  const handleSubmitSuccess = () => {
    fetchCOD();
  };

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
      {/* Drivers */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t("Drivers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {drivers && drivers?.map((driver, index) => (
                <TableRow>
                  <TableHead style={{ cursor: "pointer" }} onClick={e => fetchCOD(driver)}>{driver?.name}</TableHead>
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
            <CardTitle>{t("Pending")}</CardTitle>
            <Button type="button" variant="refresh" onClick={async () => {
              setLoading(true);
              await fetchCOD();
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
                    const codTotal = invoice.delivered_shipments
                      .filter(shipment => shipment.shipment.payment_type === "COD")
                      .reduce((sum, shipment) => sum + parseFloat(shipment.shipment.amount), 0);

                    return <TableRow key={index}>
                      <TableCell isFixed>{invoice.id}</TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {codTotal}
                      </TableCell>
                      <TableCell>
                        سئمبی Moeny
                      </TableCell>
                      <TableCell className="space-x-2">
                        <ConfirmDialog invoice={invoice} codTotal={codTotal} onSubmitSuccess={handleSubmitSuccess} />
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
    </div >
  );
}

export default FinanceDriverInvoicePending;