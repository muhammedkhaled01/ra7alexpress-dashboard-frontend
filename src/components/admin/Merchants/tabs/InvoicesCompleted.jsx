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
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { can, handleError } from "@/utils/helpers";

function MerchantInvoicesCompleted() {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [merchant, setMerchant] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [invoiceShipments, setInvoiceShipments] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false);

  const params = useParams()
  const { t } = useTranslation()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    setLoading(true)
    axiosMerchant.get("invoices/completed_user_invoice/" + params.id).then((response) => {
      setMerchant(response.data.data.merchant)
      setInvoice(response.data.data.invoice)
      setInvoiceShipments(response.data.data.invoice.invoice_shipments)
    });
    setLoading(false)
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // const handlePrint = async (invoice) => {
  //   try {
  //     setIsPrinting((prev) => ({ ...prev, [invoice.id]: true }));
  //     const response = await axiosMerchant.get(`invoices/print_completed_user_invoice/${merchant.id}`);

  //     printWaybill(response.data.html);
  //     setIsPrinting((prev) => ({ ...prev, [invoice.id]: false }));
  //   } catch (error) {
  //     setIsPrinting((prev) => ({ ...prev, [invoice.id]: false }));
  //     console.error("Error fetching invoice data for printing:", error);
  //     handleError(error)
  //   }
  // };


  const navigate = useNavigate()

  const canAccess = can("Invoice access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <div className="flex flex-row justify-between">
            <CardTitle>{t(`Invoice ${merchant?.name ? ` - ${merchant?.name}` : ''} `)}</CardTitle>
            <Button onClick={() => handlePrint(merchant)}><Printer /> {t("Print")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Tracking no")}</TableHead>
                  <TableHead>{t("Fee")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>

                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : invoiceShipments && invoiceShipments.length > 0 ? (
                  invoiceShipments.map((shipment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{shipment.shipment?.tracking_no}</TableCell>
                      <TableCell>{shipment.shipment?.delivery_fee}</TableCell>
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
    </div >
  );
}

export default MerchantInvoicesCompleted;