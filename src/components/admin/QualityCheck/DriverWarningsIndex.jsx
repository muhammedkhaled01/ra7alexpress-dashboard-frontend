import axiosMerchant from "@/axios";
import React, {useEffect, useState} from "react";
import {Button} from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import {useNavigate} from "react-router-dom";
import Pagination from "@/components/Pagination";
import {Input} from "@/components/ui/input";
import {RefreshCcw} from "lucide-react";
import {can, handleError} from "@/utils/helpers";
import Loader from "@/components/Loader";
import {useTranslation} from "react-i18next";
import {Label} from "@/components/ui/label.jsx";
import Select from "@/components/misc/Select.jsx";
import {useDispatch, useSelector} from "react-redux";
import {getDrivers} from "@/stores/features/ajaxFeature.jsx";

const DriverWarningsIndex = () => {
    const drivers = useSelector((store) => store.ajax.drivers);
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [warnings, setWarnings] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [selectedDriver, setSelectedDriver] = useState(null);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const accessAbility = can("Fine access");

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    console.log(drivers, 'drivers')
    const fetchWarnings = React.useCallback(async (pageNumber, searchQuery = "", driverId = null) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", pageNumber);
            if (searchQuery) {
                params.append("query", searchQuery);
            }
            if (driverId) {
                params.append("driver_id", driverId);
            }
            const response = await axiosMerchant.get(`driver-warnings?${params.toString()}`);
            setLinks(response.data.data.links || []);
            setWarnings(response.data.data.data || []);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, []);

    const onDriverChange = (driverId) => {
        setSelectedDriver(driverId);
        setCurrentPage(1); // Reset to first page on new filter
    };

    const handleRefresh = () => {
        setSearch("");
        setSelectedDriver(null);
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchWarnings(1, "", null);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    useEffect(() => {
        if (!accessAbility) {
            navigate("/unauthorized");
        } else {
            if (!drivers) dispatch(getDrivers());
        }
    }, [accessAbility, navigate, drivers, dispatch]);

    useEffect(() => {
        fetchWarnings(currentPage, debouncedSearch, selectedDriver);
    }, [currentPage, debouncedSearch, selectedDriver, fetchWarnings]);

    return (<div>
            <div className="flex justify-between mt-2">
                <PageTitle title={t("Driver Warnings")}/>
                <div className={'flex justify-center items-center gap-3 flex-col md:flex-row'}>
                    <div className={'w-full'}>
                        <Select
                            value={selectedDriver ? {
                                value: selectedDriver, label: drivers?.find((d) => d.id === selectedDriver)?.name || "",
                            } : null}
                            onChange={(selectedOption) => onDriverChange(selectedOption?.value)}
                            options={drivers?.map((driver) => ({
                                value: driver?.id, label: driver?.name,
                            })) || []}
                            placeholder={t("Select Driver...")}
                            noOptionsMessage={() => t("No drivers available")}
                            isClearable={true}
                        />
                    </div>
                    <div className="flex gap-x-2">
                    </div>
                    <Input
                        name="search"
                        type="text"
                        className="w-[200px]"
                        value={search}
                        id="search"
                        placeholder={t("Tracking Number...")}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={search && (<RefreshCcw
                                className="w-4 h-4 cursor-pointer"
                                onClick={() => setSearch("")} // Changed to only clear search
                            />)}
                    />
                    <Button type="button" variant="refresh" onClick={handleRefresh}>
                        <RefreshCcw className="w-4 h-4"/>
                    </Button>
                </div>

            </div>

            <div className="shadow-md py-4 mt-2 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">#</TableHead>
                            <TableHead>{t("Tracking No")}</TableHead>
                            <TableHead>{t("Driver")}</TableHead>
                            <TableHead>{t("Title")}</TableHead>
                            <TableHead>{t("Content")}</TableHead>
                            <TableHead>{t("Date")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (<TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    <Loader/>
                                </TableCell>
                            </TableRow>) : warnings && warnings.length > 0 ? (warnings.map((warning, index) => (
                                <TableRow key={index}>
                                    <TableHead className="w-[100px] sticky left-0 bg-white z-10">
                                        {index + 1}
                                    </TableHead>
                                    <TableCell>{warning.shipment?.tracking_no}</TableCell>
                                    <TableCell>{warning.driver?.name}</TableCell>
                                    <TableCell>{warning.title}</TableCell>
                                    <TableCell>{warning.content}</TableCell>
                                    <TableCell>
                                        {new Date(warning.created_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>))) : (<TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    <NoRecordFound/>
                                </TableCell>
                            </TableRow>)}
                    </TableBody>
                </Table>
                <Pagination
                    links={links}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>);
};

export default DriverWarningsIndex;