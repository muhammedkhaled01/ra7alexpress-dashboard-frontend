import { useEffect, useState } from "react";
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

import { can, formatDecimalValue, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import { useDispatch, useSelector } from "react-redux";

import {
  getCities,
  getMerchants,
  getConsignees,
  getCountries,
  getGovernorates,
  getPlaces,
  getShippers,
  getStates,
  getUnits,
} from "@/stores/features/ajaxFeature";
import { Textarea } from "@/components/ui/textarea";
import RequiredField from "@/components/misc/RequiredField";
import { isPhoneValid } from "@/components/misc/PhoneInput";
import { Checkbox } from "@/components/ui/checkbox";

function ShipmentCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [itemRows, setItemRows] = useState([{ id: Date.now(), value: "" }]);
  const [countryValue, _setCountryValue] = useState(null);
  const [governorateValue, _setGovernorateValue] = useState(null);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [stateValue, _setStateValue] = useState(null);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [paymentType, setPaymentType] = useState("");
  const [amount, setAmount] = useState("");
  const [merchantValue, _setMerchantValue] = useState("");
  const [shipperValue, setShipperValue] = useState(null);
  const [feePayer, setFeePayer] = useState(null);
  const [disableDeliveryFee, setDisableDeliveryFee] = useState(false);
  const [commission, setCommission] = useState("");
  const [placeValue, setPlaceValue] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [cityValue, setCityValue] = useState(null);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showFeePayer, setShowFeePayer] = useState(false);
  const { t } = useTranslation();
  const paymentOptions = [
    { value: "Paid", label: t("Paid") },
    { value: "COD", label: t("COD") },
  ];
  const handlePaymentTypeChange = (selectedOption) => {
    setPaymentType(selectedOption);
    if (selectedOption.value === "Paid") {
      setAmount(0);
    }
    if (selectedOption.value === "Paid") {
      setShowFeePayer(true);
    } else {
      setShowFeePayer(false);
    }

    console.log(showFeePayer);
  };

  const handleAmountChange = (e) => {
    if (paymentType.value !== "Paid") {
      setAmount(e.target.value);
    }
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    countries,
    governorates,
    states,
    places,
    cities,
    shippers,
    merchants,
    consignees,
    addresses,
    units,
    shippersLoading,
    merchantsLoading,
    unitsLoading,
    countriesLoading,
    governoratesLoading,
    statesLoading,
    citiesLoading,
    placesLoading,
  } = useSelector((store) => store.ajax);
  const { decimalPrecision } = useSelector((state) => state.setting);
  useEffect(() => {
    if (commission) {
      const formattedCommission = formatDecimalValue(
        commission,
        decimalPrecision
      );
      setCommission(formattedCommission);
    }
  }, [decimalPrecision, commission]);
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
  const stateId = recipient?.state?.value || null;

  useEffect(() => {
    if (!merchants && !merchantsLoading) dispatch(getMerchants());
    if (!shippers && !shippersLoading) dispatch(getShippers());
    if (!consignees) dispatch(getConsignees());
    if (!units && !unitsLoading) dispatch(getUnits());
    if (!countries && !countriesLoading) dispatch(getCountries());
    if (!governorates && !governoratesLoading) dispatch(getGovernorates());
    if (!states && !statesLoading) dispatch(getStates());
    if (!cities && !citiesLoading) dispatch(getCities());
    if (!places && !placesLoading) dispatch(getPlaces({ force: true }));
  }, [dispatch]);
  useEffect(() => {
    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
      setCountryValue({ value: defaultCountry.id, label: defaultCountry.name });
    }
  }, [countries]);
  useEffect(() => {
    if (countryValue?.label === "Egypt" && governorates) {
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) =>
            governorate.country_id?.toString() ===
            countryValue?.value?.toString()
        )
      );
    }
  }, [countryValue, governorates]);
  // useEffect(() => {
  //   console.log("consignees from props:", consignees);
  // }, [consignees]);
  useEffect(() => {
    console.log("raw consignees prop:", consignees);
    if (consignees && consignees.length) {
      // print fully the first item to inspect all keys
      console.log(
        "first consignee full object:",
        JSON.stringify(consignees[0], null, 2)
      );
    }
  }, [consignees]);
  // useEffect(() => {
  //   if (shippers && shippers.length > 0 && !shipperValue) {
  //     const ra7alExpressShipper = shippers.find(
  //       (shipper) => shipper.name === "Ra7al Express"
  //     );
  //     if (ra7alExpressShipper) {
  //       setShipperValue({
  //         value: ra7alExpressShipper.id,
  //         label: ra7alExpressShipper.name,
  //       });
  //     }
  //   }
  // }, [shippers, shipperValue]);

  useEffect(() => {
    if (shippers && shippers.length > 0 && !shipperValue) {
      const ra7alExpressShipper = shippers.find(
        (s) => s.name === "Ra7al Express"
      );
      if (ra7alExpressShipper) {
        const selected = {
          value: ra7alExpressShipper.id,
          label: ra7alExpressShipper.name,
        };
        setShipperValue(selected);

        if (stateValue?.value) {
          fetchFee({
            merchantId: merchantValue?.value || null,
            shipperId: selected.value,
            stateId: stateValue.value,
          });
        }
      }
    }
  }, [shippers, shipperValue, stateValue, merchantValue]);

  useEffect(() => {
    if (countryValue?.label === "Egypt" && governorates) {
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) =>
            governorate.country_id?.toString() ===
            countryValue?.value?.toString()
        )
      );
    } else {
      setFilteredGovernorates([]);
    }
  }, [countryValue, governorates]);
  useEffect(() => {
    if (governorateValue?.value && states) {
      setFilteredStates(
        states?.filter(
          (state) =>
            state.governorate_id?.toString() ===
            governorateValue.value.toString()
        )
      );
    } else if (countryValue?.label !== "Egypt" && states) {
      setFilteredStates(
        states?.filter(
          (state) =>
            state.country_id?.toString() === countryValue?.value?.toString()
        )
      );
    } else {
      setFilteredStates([]);
    }
  }, [governorateValue, countryValue, states]);
  useEffect(() => {
    if (stateValue?.value) {
      if (countryValue?.label === "Egypt" && places) {
        setFilteredPlaces(
          places?.filter(
            (place) =>
              place.state_id?.toString() === stateValue.value.toString()
          )
        );
      } else if (cities) {
        setFilteredCities(
          cities?.filter(
            (city) => city.state_id?.toString() === stateValue.value.toString()
          )
        );
      }
    } else {
      setFilteredPlaces([]);
      setFilteredCities([]);
    }
  }, [stateValue, countryValue, places, cities]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!stateId) {
        setCommission("");
        return;
      }

      try {
        // Try merchant first (priority)
        if (merchantValue?.value) {
          const res = await axiosMerchant.get(
            `merchant_commissions/by_state/${merchantValue.value}/${stateId}`
          );
          const fee = res?.data?.data?.delivery_fee;
          if (!cancelled) setCommission(fee ?? "");
          return; // stop if merchant fee path used
        }

        // Otherwise fall back to shipper
        if (shipperValue?.value) {
          const res = await axiosMerchant.get(
            `shipper_commissions/by_state/${shipperValue.value}/${stateId}`
          );
          const fee = res?.data?.data?.delivery_fee;
          if (!cancelled) setCommission(fee ?? "");
          return;
        }

        if (!cancelled) setCommission("");
      } catch (e) {
        if (!cancelled) {
          if (e?.response?.status === 404) setCommission("");
          else {
            console.error("Error fetching fee:", e);
            setCommission("");
          }
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [merchantValue?.value, shipperValue?.value, stateId]);

  const [errors, setErrors] = useState({});
  const handleReset = () => {
    setItemRows([{ id: Date.now(), value: "" }]);
    _setCountryValue(null);
    _setGovernorateValue(null);
    _setStateValue(null);
    setFilteredGovernorates([]);
    setFilteredStates([]);
    setFilteredPlaces([]);
    setPaymentType(null);
    setAmount("");
    _setMerchantValue(null);
    setShipperValue(null);
    setFeePayer(null);
    setDisableDeliveryFee(false);
    setCommission("");
    setPlaceValue(null);
    setEmail("");
    setPhone("");
    setAlternatePhone("");
    setStreetAddress("");
    setZipcode("");
    setCityValue(null);
    setShowFeePayer(false);
    setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    try {
      const newErrors = {};

      // phone (from recipient)
      if (!recipient.phone) {
        newErrors.phone = t("Phone is required");
      } else if (!isPhoneValid(recipient.phone)) {
        newErrors.phone = t("Please enter a valid phone number");
      }

      // country/state (from recipient)
      if (!recipient.country?.value) {
        newErrors.country = t("Country is required");
      }
      if (!recipient.state?.value) {
        newErrors.state = t("State is required");
      }

      // governorate only when Egypt (from recipient)
      if (
        recipient.country?.label === "Egypt" &&
        !recipient.governorate?.value
      ) {
        newErrors.governorate = t("Governorate type is required for Egypt");
      }

      // payment validations (same as before)
      if (paymentType && paymentType.value === "COD" && !amount) {
        newErrors.amount = t("Amount is required");
      }
      if (!paymentType) {
        newErrors.paymentType = t("Payment type is required");
      }
      if (merchantValue?.value && !feePayer?.value) {
        newErrors.feePayer = t("Fee payer is required");
      }
      console.log(newErrors, "newErrors");
      const form = new FormData(e.currentTarget);
      // quantity checks stay the same
      const quantities = form.getAll("quantity[]");
      quantities.forEach((q, index) => {
        if (q.trim() !== "" && isNaN(q)) {
          newErrors[`quantity_${index}`] = t("Quantity must be a valid number");
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error(t("Check required inputs"));
        setIsLoading(false);
        return;
      }
      form.set("name", recipient.name || "المستلم");
      form.set("email", recipient.email || "");
      form.set("cellphone", recipient.phone || "");
      form.set("alternatePhone", recipient.alternatePhone || "");
      form.set("streetAddress", recipient.streetAddress || "");
      form.set("zipcode", recipient.zipcode || "");
      form.set("country_id", recipient.country?.value || "");
      form.set("state_id", recipient.state?.value || "");
      form.set("governorate_id", recipient.governorate?.value || "");
      form.set("latitude", recipient.latLng?.lat || "");
      form.set("longitude", recipient.latLng?.lng || "");
      form.set("location_url", recipient.location || ""); // form.set("place_id", placeValue?.value);
      // form.set("city_id", cityValue?.value);
      // form.set("zipcode", zipcode);
      if (recipient.place?.value) {
        form.set("place_id", recipient.place.value);
        form.delete("city_id"); // safety: امسح city_id لو موجود
      } else if (recipient.city?.value) {
        form.set("city_id", recipient.city.value);
        form.delete("place_id"); // safety: امسح place_id لو موجود
      } else {
        form.delete("place_id");
        form.delete("city_id");
      }
      if (recipient.savedAddressId) {
        form.set("delivery_address_id", recipient.savedAddressId);
      }
      form.set("amount", paymentType.value === "Paid" ? 0 : amount);
      form.set(
        "fee_payer",
        merchantValue?.value ? feePayer?.value : "customer"
      );
      form.set("payment_type", paymentType?.value);
      form.set("delivery_fee", commission || 0);

      const response = await axiosMerchant.post(`shipments/store`, form);
      toast.success(response.data.message);
      dispatch(getConsignees());
      navigate("/shipments", {
        state: {
          from: "/shipments/create",
          name: "tab-/shipments/create-shipment",
        },
      });
      handleReset();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);
    // Clear dependent values when country changes
    _setGovernorateValue(null);
    _setStateValue(null);
    setPlaceValue(null);
    setCityValue(null);

    if (value.label === "Egypt") {
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) =>
            governorate.country_id?.toString() == value?.value?.toString()
        )
      );
    } else {
      setFilteredGovernorates([]);
      setFilteredPlaces([]);
      setFilteredStates(
        states?.filter(
          (state) => state.country_id?.toString() == value?.value?.toString()
        )
      );
    }
  };
  const [name, setName] = useState("");
  const handleAddItem = () => {
    setItemRows([...itemRows, { id: Date.now(), value: "" }]);
  };

  const handleRemoveItem = (id) => {
    setItemRows(itemRows.filter((row) => row.id !== id));
  };

  const setMerchantValue = (e) => {
    _setMerchantValue(e);
    setDisableDeliveryFee(true);
  };
  const onChangeShipper = (e) => {
    setShipperValue(e);
  };
  const fetchFee = async ({ merchantId, shipperId, stateId }) => {
    if (!stateId) {
      setCommission("");
      return;
    }
    try {
      if (merchantId) {
        const res = await axiosMerchant.get(
          `merchant_commissions/by_state/${merchantId}/${stateId}`
        );
        const fee = res?.data?.data?.delivery_fee;
        setCommission(fee ?? "");
        return;
      }

      if (shipperId) {
        const res = await axiosMerchant.get(
          `shipper_commissions/by_state/${shipperId}/${stateId}`
        );
        const fee = res?.data?.data?.delivery_fee;
        setCommission(fee ?? "");
        return;
      }

      setCommission("");
    } catch (e) {
      // 404 == route not found (or no record). Don’t scare the user.
      if (e?.response?.status === 404) {
        setCommission("");
        return;
      }
      console.error("Error fetching fee:", e);
      setCommission("");
    }
  };

  const canAccess = can("Shipment create");

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create New Shipment")}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("Sender")}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4">
                    <div className="mt-2 input-container">
                      <label
                        className="dark:text-gray-400"
                        htmlFor="shipper_id"
                      >
                        {t("Shipper")}
                      </label>
                      <Select
                        name="shipper_id"
                        options={shippers?.map((shipper) => ({
                          value: shipper.id,
                          label: shipper.name,
                        }))}
                        value={shipperValue || undefined}
                        onChange={onChangeShipper}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder={t("Select shipper")}
                        isLoading={shippersLoading}
                      />
                    </div>
                    <div className="mt-2 input-container">
                      <label
                        className="dark:text-gray-400"
                        htmlFor="merchant_id"
                      >
                        {t("Merchant")}
                      </label>
                      <Select
                        name="merchant_id"
                        options={[
                          { value: null, label: "No Merchant" },
                          ...(merchants?.map((merchant) => ({
                            value: merchant.id,
                            label: merchant.name,
                          })) || []),
                        ]}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        value={merchantValue || undefined}
                        onChange={(e) => setMerchantValue(e)}
                        isLoading={merchantsLoading}
                      />
                    </div>
                  </div>

                  <div
                    className={`grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-3`}
                    // ${showFeePayer ? "lg:grid-cols-3" : "lg:grid-cols-1"
                    // } gap-4 mt-3`}
                  >
                    {/* <div className="input-container">
                      <label
                        className="dark:text-gray-400"
                        htmlFor="delivery_fee"
                      >
                        {t("Delivery Fee")}:
                      </label>
                      <Input
                        type="number"
                        id="delivery_fee"
                        name="delivery_fee"
                        placeholder={t("Enter delivery cost")}
                        step="0.0001"
                        value={commission || ""}
                        disabled={disableDeliveryFee}
                      />
                    </div> */}
                    <div className="input-container">
                      <label
                        className="dark:text-gray-400"
                        htmlFor="payment_type"
                      >
                        {t("Payment Type")} <RequiredField />
                      </label>
                      <div className="flex flex-col gap-1">
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
                    {/* {showFeePayer && ( */}
                    {merchantValue?.value && (
                      <div className="input-container">
                        <label
                          className="dark:text-gray-400"
                          htmlFor="fee_payer"
                        >
                          {t("Fee Payer")}: <RequiredField />
                        </label>
                        <div className="flex flex-col gap-1">
                          {[
                            { label: t("Customer"), value: "customer" },
                            { label: t("Merchant"), value: "merchant" },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center gap-x-2"
                            >
                              <Checkbox
                                id={`fee_payer_${option.value}`}
                                checked={feePayer?.value === option.value}
                                onCheckedChange={() =>
                                  setFeePayer({ value: option.value })
                                }
                                error={errors.feePayer}
                              />
                              <label
                                htmlFor={`fee_payer_${option.value}`}
                                className="text-lg cursor-pointer"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* )} */}
                  </div>
                  <div
                    className={`grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-3`}
                  >
                    <div className="input-container">
                      <label className="dark:text-gray-400" htmlFor="value">
                        {t("Amount")}: <RequiredField />
                      </label>
                      <Input
                        id="value"
                        name="value"
                        placeholder={t("Enter amount")}
                        type="number"
                        step="0.0001"
                        value={amount}
                        onChange={handleAmountChange}
                        error={errors.amount}
                        disabled={paymentType.value === "Paid"}
                      />
                    </div>
                    <div className="input-container">
                      <label className="dark:text-gray-400" htmlFor="value">
                        {t("Fee")}: <RequiredField />
                      </label>
                      <Input
                        id="value"
                        name="value"
                        placeholder={t("Enter fee")}
                        type="number"
                        step="0.0001"
                        // value={fee}
                        // onChange={e => setFee(e.target.value)}
                        value={
                          formatDecimalValue(commission, decimalPrecision) || ""
                        }
                        error={errors.amount}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="bg-blue-50 dark:bg-gray-800 rounded px-3 py-2 text-xs  space-x-4">
                      <span className="font-semibold text-green-700 dark:text-green-300 mt-1">
                        {t("Total")}:
                        <span className="ml-1 text-green-900 dark:text-green-100">
                          {Number(amount || 0) + Number(commission || 0)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 input-container">
                    <label className="dark:text-gray-400" htmlFor="note">
                      {t("Note")}
                    </label>
                    <Textarea
                      placeholder={t(
                        "Add any special instructions or notes..."
                      )}
                      id="note"
                      name="note"
                      type="text"
                      rows={"2"}
                    />
                  </div>
                </CardContent>
              </Card>

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
                  searchBy="phone"
                  defaultCountryName="Egypt"
                  showMap={true}
                  onStateChange={(opt) => {}}
                />
              </Card>
            </div>
            <Card className="mt-4">
              <CardHeader>
                <div className="flex flex-row justify-between align-center">
                  <CardTitle className="self-center">
                    {t("Ra7al info")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-1 lg:grid-cols-5 gap-4 mt-2">
                  <div className="input-container">
                    <label className="dark:text-gray-400" htmlFor="width">
                      {t("Width")}
                    </label>
                    <Input
                      id="width"
                      name="width"
                      placeholder={t("e.g. 20")}
                      type="text"
                    />
                  </div>
                  <div className="input-container">
                    <label className="dark:text-gray-400" htmlFor="height">
                      {t("Height")}
                    </label>
                    <Input
                      id="height"
                      name="height"
                      placeholder={t("e.g. 30")}
                      type="text"
                    />
                  </div>
                  <div className="input-container">
                    <label className="dark:text-gray-400" htmlFor="length">
                      {t("Length")}
                    </label>
                    <Input
                      id="length"
                      name="length"
                      placeholder={t("e.g. 15")}
                      type="text"
                    />
                  </div>
                  <div className="input-container">
                    <label className="dark:text-gray-400" htmlFor="weight">
                      {t("Weight")}
                    </label>
                    <Input
                      id="weight"
                      name="weight"
                      placeholder={t("e.g. 2.5")}
                      type="text"
                    />
                  </div>
                  <div className="input-container">
                    <label className="dark:text-gray-400" htmlFor="unit_id">
                      {t("Unit")}
                    </label>
                    <Select
                      name="unit_id"
                      options={units?.map((unit) => ({
                        value: unit.id,
                        label: unit.name,
                      }))}
                      placeholder={t("Select a unit...")}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      isLoading={unitsLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <div className="flex flex-row justify-between align-center">
                  <CardTitle className="self-center">{t("Items")}</CardTitle>
                  <Button
                    className=" dark:bg-gray-700 dark:hover:bg-gray-900 dark:text-white"
                    type="button"
                    onClick={handleAddItem}
                    variant="add"
                  >
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
                      <label className="dark:text-gray-400" htmlFor="name">
                        {t("Name")}
                      </label>
                      <Input
                        id="name"
                        name="item_name[]"
                        type="text"
                        placeholder={t("Enter item name...")}
                      />
                    </div>
                    <div className="col-span-4 input-container">
                      <label className="dark:text-gray-400" htmlFor="category">
                        {t("Category")}
                      </label>
                      <Input
                        id="category"
                        name="category[]"
                        type="text"
                        placeholder={t("Type category...")}
                      />
                    </div>
                    <div className="col-span-3 input-container">
                      <label className="dark:text-gray-400" htmlFor="quantity">
                        {t("Quantity")}
                      </label>
                      <Input
                        id="quantity"
                        name="quantity[]"
                        type="text"
                        error={errors?.[`quantity_${index}`]}
                        placeholder={t("e.g. 1, 5, 10...")}
                      />
                    </div>

                    <div className="col-span-1 flex items-end justify-end">
                      <Button
                        type="button"
                        variant="delete"
                        onClick={() => handleRemoveItem(row.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="mt-2 ml-2 dark:bg-gray-700 dark:hover:bg-gray-900 dark:text-white"
              disabled={isLoading}
            >
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

export default ShipmentCreate;
