import axiosMerchant from "@/axios";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate, useParams } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
    EditIcon,
    EyeIcon,
    Loader2,
    MoreHorizontal,
    RefreshCcw,
    Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

const CompanyCommissionImport = () => {
    const [commissions, setCommissions] = useState(null);
    const [loading, setLoading] = useState([]);

    const params = useParams()
    const navigate = useNavigate()

    const { t } = useTranslation();

    const accessAbility = can("Commission access");
    const createAbility = can("Commission create");
    const updateAbility = can("Commission update");
    const deleteAbility = can("Commission delete");

    const formRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
    };

    const handleImport = async (e, confirm = false) => {
        e.preventDefault();
        setIsLoading(true);
        setLoading(true)
        const form = new FormData();
        if (confirm) form.append("confirm", true)
        form.append("file", file);

        try {
            const response = await axiosMerchant.post(`companies/import_commissions/${params.company_id}`, form);
            setCommissions(response.data.data)
            toast.success(response.data.message);
            formRef.current.reset();
            if (confirm) navigate('/companies/commissions/' + params.company_id)
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
            setLoading(false)
        }
    };


    const canAccess = can("Company update")

    if (!canAccess) {
        return navigate("/unauthorized");
    }

    return (
        <div>
            <PageTitle title={t("Commissions")} />
            <div>
                <Card className="mt-2">
                    <CardHeader>
                        <CardTitle>{t("Import Commissions")}</CardTitle>
                    </CardHeader>

                    <form onSubmit={handleImport} ref={formRef}>
                        <CardContent>
                            <div className="mt-1">
                                <label htmlFor="file" className="block">
                                    {t("Upload File")}
                                </label>
                                <Input
                                    id="file"
                                    name="file"
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="mt-1 ml-2" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    t("Upload")
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {commissions && <div className="shadow-md py-4 mt-2 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">{t("#")}</TableHead>
                            <TableHead>{t("Company")}</TableHead>
                            <TableHead>{t("State ID")}</TableHead>
                            <TableHead>{t("State Name")}</TableHead>
                            <TableHead>{t("Delivery Fee")}</TableHead>
                            <TableHead>{t("Pickup Fee")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : commissions && commissions.length > 0 ? (
                            commissions.map((commission, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{commission?.company}</TableCell>
                                    <TableCell>{commission?.state_id}</TableCell>
                                    <TableCell>{commission?.state_name}</TableCell>
                                    <TableCell>{commission?.delivery_fee}</TableCell>
                                    <TableCell>{commission?.pickup_fee}</TableCell>
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
                <Button type="submit" onClick={e => handleImport(e, true)} className="mt-2" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        t("Confirm & Save")
                    )}
                </Button>
            </div>}
        </div>
    );
};

export default CompanyCommissionImport;
