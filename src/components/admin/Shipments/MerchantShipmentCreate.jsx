import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Delete, Loader2, Plus, Trash2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import RecipientForm from "@/components/admin/Shipments/RecipientForm";
import { GoogleMap, Marker } from "@react-google-maps/api";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  authUser,
  can,
  generateTabId,
  handleError,
  isAuthorized,
} from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import { useDispatch, useSelector } from "react-redux";
import {
  getMerchants,
  getConsignees,
  getCountries,
  getGovernorates,
  getPlaces,
  getShippers,
  getStates,
  getUnits,
  getCities,
} from "@/stores/features/ajaxFeature";
import { Textarea } from "@/components/ui/textarea";
import RequiredField from "@/components/misc/RequiredField";
import Loader from "@/components/Loader";
import PhoneInput, { isPhoneValid } from "@/components/misc/PhoneInput";
import { Checkbox } from "@/components/ui/checkbox";
const MerchantShipmentCreate = forwardRef(
  ({ bulkMode = false, onShipmentSaved } = {}, ref) => {
    const [isLoading, setIsLoading] = useState(false);
    const [itemRows, setItemRows] = useState([{ id: Date.now(), value: "" }]);
    const formRef = useRef(null);

    const [countryValue, _setCountryValue] = useState([]);
    const [governorateValue, _setGovernorateValue] = useState([]);
    const [filteredGovernorates, setFilteredGovernorates] = useState([]);
    const [stateValue, _setStateValue] = useState([]);
    const [filteredStates, setFilteredStates] = useState([]);
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const [paymentType, setPaymentType] = useState("");
    const [amount, setAmount] = useState("");
    const [feePayer, setFeePayer] = useState(null);
    const [trackingNo, setTrackingNo] = useState("");
    const [commission, setCommission] = useState(null);

    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [alternatePhone, setAlternatePhone] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [zipcode, setZipcode] = useState("");

    const [cityValue, setCityValue] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [placeValue, setPlaceValue] = useState(null);

    const { t } = useTranslation();

    const [errors, setErrors] = useState({});
    const [disableDeliveryFee, setDisableDeliveryFee] = useState(false);

    const paymentOptions = [
      { value: "Paid", label: t("Paid") },
      { value: "COD", label: t("COD") },
    ];

    const handlePaymentTypeChange = (value) => {
      const next = value ? { value } : null;
      setPaymentType(next);
      if (value === "Paid") setAmount(0);
    };

    const handleAmountChange = (e) => {
      if (paymentType?.value !== "Paid") {
        setAmount(e.target.value);
      }
    };

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const authUser = useSelector((store) => store.auth.user);
    const {
      countries,
      loading,
      governorates,
      states,
      places,
      cities,
      shippers,
      merchants,
      consignees,
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

    useEffect(() => {
      if (!countries && !countriesLoading) dispatch(getCountries());
      if (!governorates && !governoratesLoading) dispatch(getGovernorates());
      if (!states && !statesLoading) dispatch(getStates());
      if (!places && !placesLoading) dispatch(getPlaces());
      if (!shippers && !shippersLoading) dispatch(getShippers());
      if (!merchants && !merchantsLoading) dispatch(getMerchants());
      if (!consignees) dispatch(getConsignees());
      if (!units && !unitsLoading) dispatch(getUnits());
      if (!cities && !citiesLoading) dispatch(getCities());
    }, []);

    useEffect(() => {
      const defaultCountry = countries?.find(
        (country) => country.name === "Egypt"
      );
      if (defaultCountry) {
        setCountryValue({
          value: defaultCountry.id,
          label: defaultCountry.name,
        });
      }
    }, [countries]);

    // Set initial filteredGovernorates when country is Egypt
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

    // Add useEffect to update filteredGovernorates when countryValue changes
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

    // Add useEffect to update filteredStates when governorateValue changes
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

    // Add useEffect to update filteredPlaces/filteredCities when stateValue changes
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
              (city) =>
                city.state_id?.toString() === stateValue.value.toString()
            )
          );
        }
      } else {
        setFilteredPlaces([]);
        setFilteredCities([]);
      }
    }, [stateValue, countryValue, places, cities]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setErrors({});

      try {
        const newErrors = {};

        // if (!trackingNo?.trim()) {
        //   toast.error(t("Please enter tracking no of Waybill"));
        //   setIsLoading(false);
        //   return;
        // }

        // recipient validations
        if (!recipient.phone) newErrors.phone = t("Phone is required");
        else if (!isPhoneValid(recipient.phone))
          newErrors.phone = t("Please enter a valid phone number");

        if (!recipient.country?.value)
          newErrors.country = t("Country is required");
        if (!recipient.state?.value) newErrors.state = t("State is required");

        if (
          recipient.country?.label === "Egypt" &&
          !recipient.governorate?.value
        ) {
          newErrors.governorate = t("Governorate type is required for Egypt");
        }

        // payment validations
        if (paymentType?.value === "COD" && !Number(amount))
          newErrors.amount = t("Amount is required");
        if (!paymentType?.value)
          newErrors.paymentType = t("Payment type is required");
        if (!feePayer?.value) {
          newErrors.feePayer = t("Fee payer is required");
        }

        // quantity checks
        const form = new FormData(e.currentTarget);
        const quantities = form.getAll("quantity[]");
        quantities.forEach((q, i) => {
          if (q.trim() !== "" && isNaN(q))
            newErrors[`quantity_${i}`] = t("Quantity must be a valid number");
        });

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          toast.error(t("Check required inputs"));
          setIsLoading(false);
          return;
        }

        form.append("name", recipient.name);
        form.append("email", recipient.email);
        form.append("cellphone", recipient.phone);
        form.append("alternatePhone", recipient.alternatePhone);
        form.append("streetAddress", recipient.streetAddress);
        form.append("country_id", recipient.country?.value);
        form.append("state_id", recipient.state?.value);
        form.append("governorate_id", recipient.governorate?.value);
        form.append("zipcode", recipient.zipcode || "");
        form.append("lat", recipient.latLng?.lat ?? "");
        form.append("lng", recipient.latLng?.lng ?? "");
        form.append("location", recipient.location ?? "");

        form.append("merchant_id", authUser.id);

        if (trackingNo?.trim()) {
          form.append("tracking_no", trackingNo.trim());
        }
        // form.append("amount", paymentType.value === "Paid" ? 0 : amount);
        form.append("value", paymentType.value === "Paid" ? 0 : amount);
        form.append("payment_type", paymentType?.value || "");
        form.append("fee_payer", feePayer?.value || "");
        if (commission) {
          form.append("delivery_fee", commission.delivery_fee);
        }

        const response = await axiosMerchant.post(`merchant/shipments/store`, form);
        toast.success(response.data.message);
        if (bulkMode) {
          if (typeof onShipmentSaved === "function") {
            onShipmentSaved(response.data?.data ?? null);
          }
          // handleClearFields();
        } else {
          const currentTabId = generateTabId("/merchant/shipments/create");
          navigate("/shipments", { state: { closeTabId: currentTabId } });
        }
        return response;
      } catch (error) {
        console.log(error);
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

    const setGovernorateValue = (value) => {
      _setGovernorateValue(value);
      // Clear dependent values when governorate changes
      _setStateValue(null);
      setPlaceValue(null);

      setFilteredStates(
        states?.filter(
          (state) =>
            state.governorate_id?.toString() == value?.value?.toString()
        )
      );
    };

    const setStateValue = async (value) => {
      _setStateValue(value);

      // Clear dependent values when state changes
      if (countryValue?.label === "Egypt") {
        setPlaceValue(null);
        setFilteredPlaces(
          places?.filter(
            (place) => place.state_id?.toString() == value?.value?.toString()
          )
        );
      } else {
        setCityValue(null);
        setFilteredCities(
          cities?.filter(
            (city) => city.state_id?.toString() == value?.value?.toString()
          )
        );
      }

      // Fetch commission for the selected state
      await axiosMerchant
        .get(`merchant_commissions/by_state/${authUser.id}/${value.value}`)
        .then((res) => {
          setCommission(res.data.data);
        });
    };

    const [name, setName] = useState("");
    const [recipientData, setRecipientData] = useState(null);

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

    // Store the timeout ID to clear it when the user types again
    const [debounceTimeout, setDebounceTimeout] = useState(null);

    // Debounced search function (manual implementation)
    const debouncedSearch = (searchTerm) => {
      if (!searchTerm) {
        setRecipientData(null);
        return;
      }

      // Filter customer data in the store based on the name (case-insensitive search)
      const filteredRecipients = consignees.filter((customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // If there are any matching recipients, set them to state, otherwise clear the state
      if (filteredRecipients.length > 0) {
        setRecipientData(filteredRecipients);
      } else {
        setRecipientData(null);
      }
    };

    const handleSearch = (e) => {
      const value = e.target.value;
      setName(value);
      debouncedSearch(value);
    };

    const handleSelectRecipient = (recipient) => {
      setName(recipient.name);
      setEmail(recipient.email);
      setPhone(recipient.cellphone);
      setAlternatePhone(recipient.alternatePhone);
      setStreetAddress(recipient.streetAddress);
      setZipcode(recipient.zipcode);

      // Find the corresponding country, governorate, state, and city from the store based on IDs
      const selectedCountry = countries.find(
        (country) => country.id === recipient.country_id
      );
      const selectedGovernorate = governorates?.find(
        (gov) => gov.id === recipient.governorate_id
      );

      const selectedState = states.find(
        (state) => state.id === recipient.state_id
      );

      const selectedPlace = places.find(
        (place) => place.id === recipient.place_id
      );

      const selectedCity = cities.find((city) => city.id === recipient.city_id);

      // Set country
      if (selectedCountry) {
        setCountryValue({
          value: selectedCountry.id,
          label: selectedCountry.name,
        });
      } else {
        setCountryValue(null);
      }

      // Set governorate
      if (selectedGovernorate) {
        _setGovernorateValue({
          value: selectedGovernorate.id,
          label: `${selectedGovernorate.en_name} / ${
            selectedGovernorate.ar_name ?? ""
          }`,
        });
      } else {
        _setGovernorateValue(null);
      }

      // Set state
      if (selectedState) {
        setStateValue({
          value: selectedState.id,
          label:
            selectedCountry?.name === "Egypt"
              ? `${selectedState.en_name} / ${selectedState.ar_name ?? ""}`
              : selectedState.en_name,
        });
      } else {
        _setStateValue(null);
      }

      // Set city if not Egypt
      if (selectedCountry?.name !== "Egypt" && selectedCity) {
        setCityValue({
          value: selectedCity.id,
          label: selectedCity.name,
        });
      } else {
        setCityValue(null);
      }

      if (selectedPlace) {
        setPlaceValue({
          value: selectedPlace.id,
          label: `${selectedPlace.en_name} / ${selectedPlace.ar_name ?? ""}`,
        });
      } else {
        setPlaceValue(null);
      }

      setRecipientData(null); // Clear suggestions once a recipient is selected
    };

    const handleClearFields = () => {
      setName("");
      setEmail("");
      setPhone("");
      setAlternatePhone("");
      setStreetAddress("");
      setZipcode("");
      setCountryValue({ label: "Egypt", value: "165" });
      setGovernorateValue(null);
      setStateValue(null);
      setCityValue(null);
      setPlaceValue(null);
    };

    const handleAddItem = () => {
      setItemRows([...itemRows, { id: Date.now(), value: "" }]);
    };

    const handleRemoveItem = (id) => {
      setItemRows(itemRows.filter((row) => row.id !== id));
    };

    const canAccess = can("Shipment create");

    if (!canAccess) {
      return navigate("/unauthorized");
    }

    // expose submitShipment to parent when used in bulk mode
    useImperativeHandle(ref, () => ({
      submitShipment: () => {
        if (formRef.current) {
          return handleSubmit({
            preventDefault: () => {},
            currentTarget: formRef.current,
          });
        }
      },
    }));

    return (
      <div>
        <Card className="">
          <CardHeader className="flex flex-col md:flex-row gap-4 justify-between align-middle">
            <CardTitle>{t("Create Merchant Shipment")}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} ref={formRef}>
            <CardContent>
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
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
                    onStateChange={(opt) => {
                      axiosMerchant
                        .get(
                          `merchant_commissions/by_state/${authUser.id}/${opt.value}`
                        )
                        .then((res) => setCommission(res.data.data))
                        .catch(() => setCommission(null));
                    }}
                  />
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{t("Ra7al Details")}</CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-row gap-x-4 justify-between align-middle">
                      <Input
                        className="w-[100%]"
                        id="tracking_no"
                        name="tracking_no"
                        type="text"
                        placeholder={t("Enter tracking no for waybill...")}
                        value={trackingNo}
                        onChange={(e) => setTrackingNo(e.target.value)}
                      />
                    </div>
                    <div
                      className={`grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-3`}
                    >
                      <div className="input-container">
                        <label
                          className="dark:text-gray-400"
                          htmlFor="payment_type"
                        >
                          {t("Payment Type")} <RequiredField />
                        </label>
                        <div className="flex flex-col gap-1">
                          {paymentOptions.map((opt) => (
                            <div
                              key={opt.value}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`payment_${opt.value}`}
                                checked={paymentType?.value === opt.value}
                                onCheckedChange={() =>
                                  handlePaymentTypeChange(opt.value)
                                }
                              />
                              <label
                                htmlFor={`payment_${opt.value}`}
                                className="cursor-pointer"
                              >
                                {opt.label}
                              </label>
                            </div>
                          ))}
                          {errors.paymentType && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.paymentType}
                            </p>
                          )}
                        </div>
                      </div>
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
                          ].map((opt) => (
                            <div
                              key={opt.value}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`fee_${opt.value}`}
                                checked={feePayer?.value === opt.value}
                                onCheckedChange={() =>
                                  setFeePayer({ value: opt.value })
                                }
                              />
                              <label
                                htmlFor={`fee_${opt.value}`}
                                className="cursor-pointer"
                              >
                                {opt.label}
                              </label>
                            </div>
                          ))}
                          {errors.feePayer && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.feePayer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-3`}
                    >
                      <div className="input-container">
                        <label className="dark:text-gray-400" htmlFor="amount">
                          {t("Amount")}: <RequiredField />
                        </label>
                        <Input
                          id="amount"
                          name="amount"
                          placeholder={t("Enter amount")}
                          type="number"
                          step="0.0001"
                          value={amount}
                          onChange={handleAmountChange}
                          error={errors.amount}
                          disabled={paymentType?.value === "Paid"}
                        />
                      </div>
                      <div className="input-container">
                        <label
                          className="dark:text-gray-400"
                          htmlFor="delivery_fee"
                        >
                          {t("Fee")}: <RequiredField />
                        </label>
                        <Input
                          type="number"
                          id="delivery_fee"
                          name="delivery_fee"
                          placeholder={t("Enter delivery cost")}
                          step="0.0001"
                          value={commission?.delivery_fee}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="bg-blue-50 dark:bg-gray-800 rounded px-3 py-2 text-xs space-x-4">
                        <span className="font-semibold text-green-700 dark:text-green-300 mt-1">
                          {t("Total")}:
                          <span className="ml-1 text-green-900 dark:text-green-100">
                            {Number(amount || 0) +
                              Number(commission?.delivery_fee || 0)}
                          </span>
                        </span>
                      </div>
                    </div>

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
                          placeholder={t("Unit")}
                          className="basic-multi-select"
                          classNamePrefix="select"
                        />
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
                        rows="6"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex flex-row justify-between align-middle">
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
                        <label
                          className="dark:text-gray-400"
                          htmlFor="category"
                        >
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
                        <label
                          className="dark:text-gray-400"
                          htmlFor="quantity"
                        >
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
            {!bulkMode && (
              <CardFooter>
                <Button
                  type="submit"
                  className="mt-2 ml-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("Save Changes")
                  )}
                </Button>
              </CardFooter>
            )}
          </form>
        </Card>
      </div>
    );
  }
);

export default MerchantShipmentCreate;
