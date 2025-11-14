import React, {useEffect, useState, useMemo} from "react";
import {useTranslation} from "react-i18next";
import {useLocation} from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Select from "@/components/misc/Select";
import {useSelector} from "react-redux";
import axiosMerchant from "@/axios.js";
import {formatCurrency, formatCurrentCurrency, formatDecimalValue} from "@/utils/helpers";
import {useLanguage} from "@/contexts/LanguageProvider";

export default function CreateFinancialRequestDialog({
                                                         open,
                                                         onOpenChange,
                                                         type,
                                                         setType,
                                                         payeeIds,
                                                         setPayeeIds,
                                                         period,
                                                         setPeriod,
                                                         amount,
                                                         setAmount,
                                                         notes,
                                                         setNotes,
                                                         types,
                                                         onSubmit,
                                                     }) {
    const {t} = useTranslation();
    const {driversWithBonusLoading} = useSelector((state) => state.ajax);
    const [netBalance, setNetBalance] = useState(0)
    const [drivers, setDrivers] = useState([]);
    const [merchants, setMerchants] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [loadingMerchants, setLoadingMerchants] = useState(false);
    const location = useLocation();
    const {language} = useLanguage();
    const {currencyEnglishName, currencyArabicName, decimalPrecision} = useSelector((state) => state.setting);

    const getWarehouseParams = () => {
        const path = location.pathname;
        if (path.includes("/stations/") && path.includes("/financial-requests")) {
            const id = path.split("/stations/")[1]?.split("/financial-requests")[0];
            return {warehouse_id: id, warehouse_type: "station"};
        } else if (path.includes("/hubs/") && path.includes("/financial-requests")) {
            const id = path.split("/hubs/")[1]?.split("/financial-requests")[0];
            return {warehouse_id: id, warehouse_type: "hub"};
        }
        console.warn("URL does not match expected patterns");
        return {warehouse_id: null, warehouse_type: null};
    };

    const fetchNetBalance = async () => {
        try {
            const response = await axiosMerchant.get(
                `get-net-ballance`
            );
            setNetBalance(response.data.data.net_balance || 0);
        } catch (error) {
            console.error("Error fetching net balance:", error.message);
            setNetBalance(0);
        }
    };

    const fetchDrivers = async () => {
        const {warehouse_id, warehouse_type} = getWarehouseParams();
        if (!warehouse_id || !warehouse_type) {
            console.warn("Skipping API call due to missing warehouse_id or warehouse_type");
            setDrivers([]);
            return;
        }
        setLoadingDrivers(true);
        try {
            const response = await axiosMerchant.get(
                `users/get-all-drivers-with-bonuses/${warehouse_id}/${warehouse_type}`
            );
            setDrivers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching drivers:", error.message);
            setDrivers([]);
        } finally {
            setLoadingDrivers(false);
        }
    };

    const fetchMerchants = async () => {
        const {warehouse_id, warehouse_type} = getWarehouseParams();
        if (!warehouse_id || !warehouse_type) {
            console.warn("Skipping API call due to missing warehouse_id or warehouse_type");
            setMerchants([]);
            return;
        }
        setLoadingMerchants(true);
        try {
            const response = await axiosMerchant.get(
                `users/get-all-merchants-with-balances/${warehouse_id}/${warehouse_type}`
            );
            setMerchants(response.data.data || []);
        } catch (error) {
            console.error("Error fetching merchants:", error.message);
            setMerchants([]);
        } finally {
            setLoadingMerchants(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchDrivers();
            fetchMerchants();
            fetchNetBalance();
        }
        setPayeeIds([]);
        setAmount("");
    }, [open, type, setPayeeIds]);

    const driverOptions = useMemo(() => {
        const options = drivers.map((driver) => ({
            value: driver?.id,
            label: `${driver?.name} (${driver?.phone ? `${driver?.country_code || ''}${driver?.phone}` : 'No phone'}) - Bonus: ${formatCurrency(driver?.bonus_due || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}`,
            driver,
        }));
        return [
            {
                value: "select-all",
                label: t("Select All"),
                isSelectAll: true,
            },
            ...options,
        ];
    }, [drivers, t]);

    const merchantOptions = useMemo(() => {
        const options = merchants.map((merchant) => ({
            value: merchant.id,
            label: `${merchant.name} (${merchant.phone ? `${merchant.country_code || ''}${merchant.phone}` : 'No phone'}) - Balance: ${formatCurrency(merchant.current_balance || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}`,
            merchant,
        }));
        return [
            {
                value: "select-all",
                label: t("Select All"),
                isSelectAll: true,
            },
            ...options,
        ];
    }, [merchants, t]);

    const handlePayeeChange = (selectedOptions) => {
        if (selectedOptions.some((option) => option.isSelectAll)) {
            const allOptions = (type?.value === "driver_salary" ? driverOptions : merchantOptions).filter((opt) => !opt.isSelectAll);
            setPayeeIds(allOptions);
        } else {
            setPayeeIds(selectedOptions);
        }
    };

    const totalAmount = useMemo(() => {
        if (type?.value === "driver_salary" && Array.isArray(payeeIds)) {
            return payeeIds.reduce((sum, option) => sum + (option.driver?.bonus_due || 0), 0);
        } else if (type?.value === "merchant_settlement" && Array.isArray(payeeIds)) {
            return payeeIds.reduce((sum, option) => sum + (option.merchant?.current_balance || 0), 0);
        }
        return 0;
    }, [payeeIds, type, drivers, merchants]);

    const isAmountValid = useMemo(() => {
        const amountValue = parseFloat(amount) || 0;
        return amountValue > 0 && amountValue <= (netBalance || 0);
    }, [amount, netBalance]);

    const validateDecimalInput = (value) => {
        const regex = new RegExp(`^\\d*\\.?\\d{0,${decimalPrecision || 2}}$`);
        return regex.test(value);
    };

    const handleAmountChange = (value) => {
        if (!validateDecimalInput(value)) {
            return;
        }
        const parts = value.split('.');
        if (parts?.length === 2 && parts[1]?.length > (decimalPrecision || 2)) {
            value = `${parts[0]}.${parts[1].substring(0, decimalPrecision || 2)}`;
        }
        setAmount(value);
    };

    const handleSubmit = (event) => {
        console.log("handleSubmit called with event:", event);
        try {
            if (event && typeof event.preventDefault === 'function') {
                event.persist(); // Persist to prevent event pooling issues
                event.preventDefault();
                console.log("preventDefault called, defaultPrevented:", event.defaultPrevented);
            } else {
                console.warn("Event object is missing or preventDefault is not a function:", event);
            }
            const formData = new FormData(event?.currentTarget || document.createElement('form'));
            formData.append("type", type?.value || "");
            formData.append("payee_ids", JSON.stringify(payeeIds.map((opt) => opt.value)));
            formData.append("period_date", period || "");
            formData.append("amount", amount || "");
            formData.append("notes", notes || "");
            console.log("FormData:", Array.from(formData.entries()));
            onSubmit(formData);
        } catch (error) {
            console.error("Error in handleSubmit:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl" aria-describedby="dialog-description">
                <DialogHeader>
                    <DialogTitle>{t("Create New Financial Request")}</DialogTitle>
                </DialogHeader>
                <div id="dialog-description" className="sr-only">
                    {t("Form to create a new financial request with fields for type, payee, period, amount, and notes.")}
                </div>
                <form className="space-y-3" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm mb-1 block">{t("Request Type")}</label>
                        <Select
                            value={type}
                            onChange={setType}
                            options={types}
                            placeholder={t("Select Type")}
                        />
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">
                            {type?.value === "driver_salary"
                                ? t("Driver Name")
                                : type?.value === "merchant_settlement"
                                    ? t("Merchant Name")
                                    : t("Branch")}
                        </label>
                        {type?.value === "driver_salary" ? (
                            <div className="space-y-2">
                                <Select
                                    isMulti
                                    value={payeeIds}
                                    onChange={handlePayeeChange}
                                    isLoading={driversWithBonusLoading || loadingDrivers}
                                    options={driverOptions}
                                    placeholder={t("Select Driver(s)")}
                                    isSearchable
                                    closeMenuOnSelect={false}
                                />
                                {Array.isArray(payeeIds) && payeeIds?.length > 0 && (
                                    <div
                                        className="mt-2 space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-md shadow-sm">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {t("Selected Drivers")}
                                        </h4>
                                        {payeeIds.map((option) => (
                                            <div
                                                key={option.value}
                                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {option.driver?.name || t("Unknown Driver")}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {option.driver?.phone
                                                            ? `${option.driver?.country_code || ''}${option.driver?.phone}`
                                                            : t("No phone")}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {t("Bonus")}: {formatCurrency(option.driver?.bonus_due || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setPayeeIds(payeeIds.filter((item) => item.value !== option.value))
                                                    }
                                                >
                                                    {t("Remove")}
                                                </Button>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {t("Total Selected Bonuses")}: {formatCurrency(totalAmount, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : type?.value === "merchant_settlement" ? (
                            <div className="space-y-2">
                                <Select
                                    isMulti
                                    value={payeeIds}
                                    onChange={handlePayeeChange}
                                    isLoading={loadingMerchants}
                                    options={merchantOptions}
                                    placeholder={t("Select Merchant(s)")}
                                    isSearchable
                                    closeMenuOnSelect={false}
                                />
                                {Array.isArray(payeeIds) && payeeIds?.length > 0 && (
                                    <div
                                        className="mt-2 space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-md shadow-sm">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {t("Selected Merchants")}
                                        </h4>
                                        {payeeIds.map((option) => (
                                            <div
                                                key={option.value}
                                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {option.merchant?.name || t("Unknown Merchant")}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {option.merchant?.phone
                                                            ? `${option.merchant.country_code || ''}${option.merchant.phone}`
                                                            : t("No phone")}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {t("Balance")}: {formatCurrency(option.merchant?.current_balance || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setPayeeIds(payeeIds.filter((item) => item.value !== option.value))
                                                    }
                                                >
                                                    {t("Remove")}
                                                </Button>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {t("Total Selected Balance")}: {formatCurrency(totalAmount, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Input
                                value={payeeIds}
                                onChange={(e) => setPayeeIds(e.target.value)}
                                placeholder={t("Enter Branch Name")}
                            />
                        )}
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">{t("Period")}</label>
                        <Input
                            type="date"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">{t(`Amount`)} ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})</label>
                        <Input
                            type="text"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            onBlur={() => setAmount(formatDecimalValue(amount, decimalPrecision))}
                            placeholder={t("Enter Amount")}
                        />
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">{t("Additional Notes")}</label>
                        <textarea
                            className="w-full border rounded-md p-2 h-24"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t("Any additional details...")}
                        />
                    </div>
                    <div className="mt-2">
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="flex gap-x-2">
                                <span>{t("Net Balance")}:</span>
                                <strong>{formatCurrency(netBalance, language, decimalPrecision, currencyEnglishName, currencyArabicName)}</strong>
                            </div>
                            <div className="flex gap-x-2">
                                <span>
                                    {type?.value === "driver_salary"
                                        ? t("Total Selected Bonuses")
                                        : type?.value === "merchant_settlement"
                                            ? t("Total Selected Balance")
                                            : t("Total Amount")}
                                </span>
                                <strong>{formatCurrency(totalAmount, language, decimalPrecision, currencyEnglishName, currencyArabicName)}</strong>
                            </div>
                            <div className="flex gap-x-2">
                                <span>{t("Entered Amount")}:</span>
                                <strong>{formatCurrency(amount, language, decimalPrecision, currencyEnglishName, currencyArabicName)}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                        >
                            {t("Cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isAmountValid || !payeeIds || (Array.isArray(payeeIds) && payeeIds?.length === 0)}
                        >
                            {t("Submit Request")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}