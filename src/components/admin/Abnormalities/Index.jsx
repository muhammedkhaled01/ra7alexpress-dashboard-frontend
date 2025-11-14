import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import Pagination from "@/components/Pagination";
import { handleError, humanizeText } from "@/utils/helpers";
import { t } from "i18next";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";

const Abnormalities = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [abnormalities, setAbnormalities] = useState([]);

    useEffect(() => {
        fetchAbnormalities(currentPage);
    }, [currentPage]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const fetchAbnormalities = async (pageNumber) => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(`abnormalities?page=${pageNumber}`);
            setLinks(response.data.data.links);
            setAbnormalities(response.data.data.data);
        } catch (error) {
            handleError(error)
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between mt-2">
                <PageTitle title="Abnormalities" />
            </div>

            <div className="shadow-md py-4 mt-2 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">#</TableHead>
                            <TableHead>{t("Shipment")}</TableHead>
                            <TableHead>{t("Type")}</TableHead>
                            <TableHead>{t("Notes")}</TableHead>
                            <TableHead>{t("Date / Time")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : abnormalities && abnormalities.length > 0 ? (
                            abnormalities.map((abnormality, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{abnormality.shipment?.tracking_no}</TableCell>
                                    <TableCell>{humanizeText(abnormality.type)}</TableCell>
                                    <TableCell>{abnormality.notes}</TableCell>
                                    <TableCell>{new Date(abnormality.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center">
                                    <NoRecordFound />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <Pagination
                    links={links || []}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
}

export default Abnormalities
