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
import { CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { can, capitalize, handleError } from "@/utils/helpers";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

function CompanyDriverInvoices() {
    const [loading, setLoading] = useState(false);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [company, setCompany] = useState(null)
    const [invoices, setInvoices] = useState(null)
    const [invoiceShipments, setInvoiceShipments] = useState(null)
    const [btnLoading, setBtnLoading] = useState(false);

    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setselectedRecord] = useState(null);

    const params = useParams()
    const navigate = useNavigate()
    const { t } = useTranslation()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        setLoading(true)
        axiosMerchant.get("invoices/pending_company_driver_invoices/" + params.company_id).then((response) => {
            setCompany(response.data.data.company)
            setInvoices(response.data.data.invoices)
        });
        setLoading(false)
    }

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleConfirmAll = async () => {
        try {
            setBtnLoading(true);
            const response = await axiosMerchant.get(`invoices/confirm_company_driver_invoices/${params.company_id}`);
            toast.success(response.data.message)
            navigate('/companies')
        } catch (error) {
            console.error("Error fetching invoice data for printing:", error);
            handleError(error);
        } finally {
            setBtnLoading(false);
            fetchData()
        }
    };

    // DELETE ALERT
    const openDeleteAlert = (record) => {
        setselectedRecord(record);
        setDeleteAlert(true);
    };

    const closeDeleteAlert = () => {
        setselectedRecord(null);
        setDeleteAlert(false);
    };

    const handleSubmitSuccess = () => {
        fetchData();
    };

    const canAccess = can("Invoice access")

    if (!canAccess) {
        return navigate("/unauthorized");
    }

    return (
        <div>
            <Card className="">
                <CardHeader>
                    <div className="flex flex-row justify-between">
                        <CardTitle>{t(`${company?.name ? `${company?.name} - ` : ''} Invoices`)}</CardTitle>
                        <Button disabled={btnLoading} onClick={e => handleConfirmAll()}>
                            {btnLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <><CheckCheck />{t("Confirm All")}</>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="shadow-md py-4 mt-2 rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">#</TableHead>
                                    <TableHead>{t("Invoice no")}</TableHead>
                                    <TableHead>{t("Driver")}</TableHead>
                                    <TableHead>{t("Total Amount")}</TableHead>
                                    <TableHead>{t("Status")}</TableHead>
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
                                    invoices.map((invoice, index) => {
                                        const total = invoice.invoice_shipments
                                            .reduce((sum, shipment) => sum + parseFloat(shipment.shipment.amount), 0);
                                        return <TableRow key={index}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>{invoice.invoice_no}</TableCell>
                                            <TableCell>{invoice.invoiceable?.name}</TableCell>
                                            <TableCell>{total}</TableCell>
                                            <TableCell className="font-medium">
                                                <Badge variant="outline" className="hover:cursor-pointer">
                                                    {capitalize(invoice.status)}{" "}
                                                </Badge>
                                            </TableCell>
                                            {/* <TableCell>
                                                <Button onClick={() => openDeleteAlert(invoice)}>
                                                    <Trash2Icon className="h-4 w-4" />{" "}
                                                </Button>
                                            </TableCell> */}
                                        </TableRow>
                                    })
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

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeDeleteAlert}
                    api={"invoices/shipments/delete"}
                />
            )}
        </div >
    );
}

export default CompanyDriverInvoices;