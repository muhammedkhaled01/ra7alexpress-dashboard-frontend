import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Plus, Trash2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import RecipientForm from "@/components/admin/Shipments/RecipientForm";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {can, driverName, handleError} from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import { useDispatch, useSelector } from "react-redux";
import {
    getCities,
    getMerchants,
    getConsignees,
    getCountries,
    getDrivers,
    getGovernorates,
    getPlaces,
    getShippers,
    getStates,
    getUnits,
} from "@/stores/features/ajaxFeature";
import { Textarea } from "@/components/ui/textarea";
import RequiredField from "@/components/misc/RequiredField.jsx";
import {Checkbox} from "@/components/ui/checkbox.jsx";

const isPhoneValid = (p) => !!String(p || "").trim();

function CreateCustomerShipment() {
    const [isLoading, setIsLoading] = useState(false);
    const [driverId, setDriverId] = useState(null)
    const [itemRows, setItemRows] = useState([{ id: Date.now(), value: "" }]);
    const { t } = useTranslation();

    const paymentOptions = [
        { value: "Paid", label: t("Paid") },
        { value: "COD", label: t("COD") },
    ];
    const [paymentType, setPaymentType] = useState({
        value: "COD",
        label: t("COD"),
    });
    const [amount, setAmount] = useState("");

    const handlePaymentTypeChange = (selectedOption) => {
        setPaymentType(selectedOption);
        if (selectedOption?.value === "Paid") {
            setAmount(0);
        }
    };
    const handleAmountChange = (e) => {
        if (paymentType?.value !== "Paid") {
            setAmount(e.target.value);
        }
    };

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        countries,
        states,
        cities,
        places,
        shippers,
        merchants,
        consignees,
        governorates,
        units,
        countriesLoading,
        governoratesLoading,
        statesLoading,
        citiesLoading,
        placesLoading,
        drivers,
    } = useSelector((store) => store.ajax);
    useEffect(() => {
        if (!countries && !countriesLoading) dispatch(getCountries());
        if (!governorates && !governoratesLoading) dispatch(getGovernorates());
        if (!states && !statesLoading) dispatch(getStates());
        if (!cities && !citiesLoading) dispatch(getCities());
        if (!places && !placesLoading) dispatch(getPlaces());
        if (!drivers) dispatch(getDrivers());
        if (!shippers) dispatch(getShippers());
        if (!merchants) dispatch(getMerchants());
        if (!consignees) dispatch(getConsignees());
        if (!units) dispatch(getUnits());
    }, [
        countries,
        governorates,
        states,
        cities,
        places,
        shippers,
        merchants,
        consignees,
        units,
        countriesLoading,
        governoratesLoading,
        statesLoading,
        citiesLoading,
        placesLoading,
        dispatch,
    ]);

    const [isWalkinCustomer, setIsWalkinCustomer] = useState(true);

    const [sender, setSender] = useState({
        name: "",
        email: "",
        phone: "",
        alternatePhone: "",
        zipcode: "",
        streetAddress: "",
        location: "",
        latLng: null,
        country: null,
        governorate: null,
        state: null,
        city: null,
        place: null,
    });

    const [senderErrors, setSenderErrors] = useState({});

    const [recipient, setRecipient] = useState({
        name: "",
        email: "",
        phone: "",
        alternatePhone: "",
        zipcode: "",
        streetAddress: "",
        location: "",
        latLng: null,
        country: null,
        governorate: null,
        state: null,
        city: null,
        place: null,
    });
    const [errors, setErrors] = useState({});

    const resetForm = () => {
        setIsWalkinCustomer(true);
        setSender({
            name: "",
            email: "",
            phone: "",
            alternatePhone: "",
            zipcode: "",
            streetAddress: "",
            location: "",
            latLng: null,
            country: null,
            governorate: null,
            state: null,
            city: null,
            place: null,
        });
        setRecipient({
            name: "",
            email: "",
            phone: "",
            alternatePhone: "",
            zipcode: "",
            streetAddress: "",
            location: "",
            latLng: null,
            country: null,
            governorate: null,
            state: null,
            city: null,
            place: null,
        });
        setDriverId(null)
        setSenderErrors({});
        setErrors({});
        setAmount("")
        setPaymentType({ value: "COD", label: t("COD") });
        setAmount("");
        setItemRows([{ id: Date.now(), value: "" }]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setSenderErrors({});
        try {
            const senderErrorsLocal = {};
            if (!sender.name) senderErrorsLocal.name = t("Name is required");
            if (!sender.phone) senderErrorsLocal.phone = t("Phone is required");
            else if (!isPhoneValid(sender.phone)) senderErrorsLocal.phone = t("Please enter a valid phone number");
            if (!sender.country?.value) senderErrorsLocal.country = t("Country is required");
            if (!sender.state?.value) senderErrorsLocal.state = t("State is required");
            if (sender.country?.label === "Egypt" && !sender.governorate?.value) {
                senderErrorsLocal.governorate = t("Governorate type is required for Egypt");
            }

            const newErrors = {};
            if (!recipient.phone) {
                newErrors.phone = t("Phone is required");
            } else if (!isPhoneValid(recipient.phone)) {
                newErrors.phone = t("Please enter a valid phone number");
            }
            if (!recipient.country?.value)
                newErrors.country = t("Country is required");
            if (!recipient.state?.value) newErrors.state = t("State is required");
            if (
                recipient.country?.label === "Egypt" &&
                !recipient.governorate?.value
            ) {
                newErrors.governorate = t("Governorate type is required for Egypt");
            }
            if (paymentType?.value === "COD" && !amount) {
                newErrors.amount = t("Amount is required");
            }

            const formCheck = new FormData(e.currentTarget);
            const quantities = formCheck.getAll("quantity[]");
            quantities.forEach((q, index) => {
                if (String(q).trim() !== "" && isNaN(q)) {
                    newErrors[`quantity_${index}`] = t("Quantity must be a valid number");
                }
            });

            setSenderErrors(senderErrorsLocal);
            setErrors(newErrors);

            if (Object.keys(senderErrorsLocal).length > 0 || Object.keys(newErrors).length > 0) {
                toast.error(t("Check required inputs"));
                setIsLoading(false);
                return;
            }

            const form = new FormData(e.currentTarget);

            if (isWalkinCustomer) {
                form.set("is_walkin", true);
                form.set("merchant_name", sender.name);
                form.set("driver_id", driverId);
                form.set("merchant_phone", sender.phone);
                form.set("sender_streetAddress", sender.streetAddress || "");
                form.set("sender_zipcode", sender.zipcode || "");
                form.set("sender_location_url", sender.location || "");
                form.set("sender_district", sender.place?.label || sender.city?.label || sender.state?.label || "");
                form.set("sender_notes", "");
                form.set("sender_country_id", sender.country?.value || "");
                form.set("sender_state_id", sender.state?.value || "");
                form.set("sender_governorate_id", sender.governorate?.value || "");

                if (sender.place?.value) {
                    form.set("sender_place_id", sender.place.value);
                    form.delete("sender_city_id");
                } else if (sender.city?.value) {
                    form.set("sender_city_id", sender.city.value);
                    form.delete("sender_place_id");
                } else {
                    form.delete("sender_place_id");
                    form.delete("sender_city_id");
                }
            }

            form.set("name", recipient.name || "المستلم");
            form.set("email", recipient.email || "");
            form.set("cellphone", recipient.phone || "");
            form.set("alternatePhone", recipient.alternatePhone || "");
            form.set("streetAddress", recipient.streetAddress || "");
            form.set("zipcode", recipient.zipcode || "");
            form.set("latitude", recipient.latLng?.lat || "");
            form.set("longitude", recipient.latLng?.lng || "");
            form.set("location", recipient.location || "");
            form.set("country_id", recipient.country?.value || "");
            form.set("state_id", recipient.state?.value || "");
            form.set("governorate_id", recipient.governorate?.value || "");

            if (recipient.place?.value) {
                form.set("place_id", recipient.place.value);
                form.delete("city_id");
            } else if (recipient.city?.value) {
                form.set("city_id", recipient.city.value);
                form.delete("place_id");
            } else {
                form.delete("place_id");
                form.delete("city_id");
            }

            form.set("amount", paymentType?.value === "Paid" ? 0 : amount);
            form.set("payment_type", paymentType?.value);

            const response = await axiosMerchant.post(`shipments/store`, form);
            toast.success(response.data.message);
            navigate("/shipments", { state: { from: "/shipments/create", name: "tab-/shipments/create_customer_shipment" } });
            resetForm();
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = () => {
        setItemRows((prev) => [...prev, { id: Date.now(), value: "" }]);
    };
    const handleRemoveItem = (id) => {
        setItemRows((prev) => prev.filter((row) => row.id !== id));
    };

    const canAccess = can("Shipment create");
    if (!canAccess) {
        return navigate("/unauthorized");
    }

    return (
        <div className={"flex flex-col gap-3"}>
            <Card className="">
                <CardHeader>
                    <CardTitle>{t("Driver Pickup Shipment")}</CardTitle>
                    <CardContent>
                        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                            <div className="w-full input-container">
                                <label htmlFor="driver_id">{t("Driver")} <RequiredField /></label>
                                <Select
                                    name="driver_id"
                                    placeholder={t("Driver")}
                                    options={drivers?.map((driver) => ({
                                        value: driver.id,
                                        label: driverName(driver),
                                    }))}
                                    className="w-full"
                                    value={{ value: driverId, label: drivers?.find(driver => driver.id === driverId)?.name || '' }}
                                    onChange={(selected) => setDriverId(prev => (selected?.value ))}
                                    isClearable={true}
                                />
                            </div>
                        </div>
                    </CardContent>
                </CardHeader>
            </Card>
            <Card className="">
                <CardHeader>
                    <CardTitle>{t("Create Walkin Shipment")}</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent>
                        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                                <CardContent>
                                    <RecipientForm
                                        title={t("Sender")}
                                        value={sender}
                                        onChange={setSender}
                                        errors={senderErrors}
                                        lists={{
                                            countries,
                                            governorates,
                                            states,
                                            places,
                                            cities,
                                            loading: {
                                                countriesLoading,
                                                governoratesLoading,
                                                statesLoading,
                                                placesLoading,
                                                citiesLoading,
                                            },
                                        }}
                                        merchants={merchants || []}
                                        entityType="merchant"
                                        searchBy="phone"
                                        defaultCountryName="Egypt"
                                        showMap={true}
                                        onStateChange={() => {}}
                                    />

                                    <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                                        <div className="input-container">
                                            <label htmlFor="delivery_fee">{t("Delivery Fee")}:</label>
                                            <Input
                                                id="delivery_fee"
                                                name="delivery_fee"
                                                placeholder={t("Enter delivery cost...")}
                                                type="number"
                                                step="0.0001"
                                            />
                                        </div>
                                        <div className="input-container">
                                            <label htmlFor="payment_type">{t("Payment Type")}:</label>
                                            <div className="flex flex-row w-full items-center gap-6 mt-2">
                                                {paymentOptions.map((option) => (
                                                    <div
                                                        key={option.value}
                                                        className="flex items-center gap-x-2"
                                                    >
                                                        <Checkbox
                                                            id={option.value}
                                                            checked={paymentType?.value === option.value}
                                                            onCheckedChange={() =>
                                                                handlePaymentTypeChange({ value: option.value })
                                                            }
                                                            error={errors.paymentType}
                                                        />
                                                        <label
                                                            htmlFor={option.value}
                                                            className="text-lg cursor-pointer"
                                                        >
                                                            {option.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="input-container">
                                            <label htmlFor="amount">{t("Amount")}:</label>
                                            <Input
                                                id="amount"
                                                name="amount_display"
                                                type="number"
                                                placeholder="0.00"
                                                step="0.0001"
                                                value={amount}
                                                error={errors?.amount}
                                                onChange={handleAmountChange}
                                                disabled={paymentType?.value === "Paid"}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2 input-container">
                                        <label htmlFor="note">{t("Note")}</label>
                                        <Textarea
                                            placeholder={t("Add any special instructions or notes...")}
                                            id="note"
                                            name="note"
                                            type="text"
                                            rows={"5"}
                                        />
                                    </div>
                                </CardContent>

                            <Card>
                                <RecipientForm
                                    title={`${t("Recipient")}/${t("Consignee")}`}
                                    value={recipient}
                                    onChange={setRecipient}
                                    errors={errors}
                                    lists={{
                                        countries,
                                        governorates,
                                        states,
                                        places,
                                        cities,
                                        loading: {
                                            countriesLoading,
                                            governoratesLoading,
                                            statesLoading,
                                            placesLoading,
                                            citiesLoading,
                                        },
                                    }}
                                    consignees={consignees || []}
                                    entityType="consignee"
                                    searchBy="phone"
                                    defaultCountryName="Egypt"
                                    showMap={true}
                                    onStateChange={() => {}}
                                />
                            </Card>
                        </div>

                        <Card className="mt-4">
                            <CardHeader>
                                <div className="flex flex-row justify-between align-middle">
                                    <CardTitle className="self-center">{t("Ra7al info")}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-1 lg:grid-cols-5 gap-4 mt-2">
                                    <div className="input-container">
                                        <label htmlFor="width">{t("Width")}</label>
                                        <Input
                                            id="width"
                                            name="width"
                                            placeholder="e.g. 20 "
                                            type="text"
                                        />
                                    </div>
                                    <div className="input-container">
                                        <label htmlFor="height">{t("Height")}</label>
                                        <Input
                                            id="height"
                                            placeholder="e.g. 30"
                                            name="height"
                                            type="text"
                                        />
                                    </div>
                                    <div className="input-container">
                                        <label htmlFor="length">{t("Length")}</label>
                                        <Input
                                            id="length"
                                            placeholder="e.g. 15"
                                            name="length"
                                            type="text"
                                        />
                                    </div>
                                    <div className="input-container">
                                        <label htmlFor="weight">{t("Weight")}</label>
                                        <Input
                                            id="weight"
                                            placeholder="e.g. 2.5 "
                                            name="weight"
                                            type="text"
                                        />
                                    </div>
                                    <div className="input-container">
                                        <label htmlFor="unit_id">{t("Unit")}</label>
                                        <Select
                                            name="unit_id"
                                            options={units?.map((unit) => ({
                                                value: unit.id,
                                                label: unit.name,
                                            }))}
                                            placeholder={t("Select unit...")}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="mt-4">
                            <CardHeader>
                                <div className="flex flex-row justify-between align-middle">
                                    <CardTitle className="self-center">{t("Items")}</CardTitle>
                                    <Button type="button" variant="add" onClick={handleAddItem}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {itemRows.map((row, index) => (
                                    <div
                                        key={row.id}
                                        className="grid sm:grid-cols-1 lg:grid-cols-12 gap-4 mt-2"
                                    >
                                        <div className="col-span-4 input-container">
                                            <label htmlFor={`item_name_${row.id}`}>{t("Name")}</label>
                                            <Input
                                                id={`item_name_${row.id}`}
                                                name="item_name[]"
                                                placeholder={t("Enter item name...")}
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-4 input-container">
                                            <label htmlFor={`category_${row.id}`}>{t("Category")}</label>
                                            <Input
                                                id={`category_${row.id}`}
                                                placeholder={t("Type category...")}
                                                name="category[]"
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-3 input-container">
                                            <label htmlFor={`quantity_${row.id}`}>{t("Quantity")}</label>
                                            <Input
                                                id={`quantity_${row.id}`}
                                                placeholder={t("e.g. 1, 5, 10...")}
                                                name="quantity[]"
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-1 flex items-end justify-end">
                                            <Button
                                                type="button"
                                                variant="delete"
                                                onClick={() => handleRemoveItem(row.id)}
                                            >
                                                <Trash2Icon className="h-4 w-4 bg-d" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="mt-2 ml-2" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t("Save Changes")
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default CreateCustomerShipment;