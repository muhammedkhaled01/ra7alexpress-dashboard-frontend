import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useParams } from "react-router-dom";

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
import { Badge } from "@/components/ui/badge";

function DriverInvoicesCompleted() {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [driver, setDriver] = useState(null)
  const [invoices, setInvoices] = useState(null)
  const params = useParams()
  const { t } = useTranslation()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    setLoading(true)
    axiosMerchant.get("invoices/driver_paid_invoices/" + params.id).then((response) => {
      setInvoices(response.data.data.invoices.data)
      setLinks(response.data.data.invoices.links)
      setDriver(response.data.data.user)
    });
    setLoading(false)
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <Card className="">
        <CardHeader>
          <div className="flex flex-row justify-between">
            <CardTitle>{`${t("Invoices")} ${driver?.name ? ` - ${driver?.name}` : ''} `}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Invoice number")}</TableHead>
                  <TableHead>{t("Amount")}</TableHead>
                  <TableHead>{t("Payment Receipt")}</TableHead>
                  <TableHead>{t("Issue Date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>

                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : invoices && invoices.length > 0 ? (
                  invoices.map((invoice, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{invoice.invoice_no}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell><a href={invoice.payment_voucher} target="_blank"><Badge>Voucher</Badge></a></TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleString()}</TableCell>
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

export default DriverInvoicesCompleted;