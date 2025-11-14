import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Plus, Trash2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./style.css";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can, handleError, isAuthorized } from "@/utils/helpers";
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
import { Checkbox } from "@/components/ui/checkbox";

function CreateCustomerShipment() {
  const [isLoading, setIsLoading] = useState(false);
  const [itemRows, setItemRows] = useState([{ id: Date.now(), value: "" }]);
  const { t } = useTranslation();
  const [countryValue, _setCountryValue] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [cityValue, setCityValue] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

  const [paymentType, setPaymentType] = useState("COD");
  const [amount, setAmount] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [zipcode, setZipcode] = useState("");

  const [isWalkinCustomer, setIsWalkinCustomer] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerIdCard, setCustomerIdCard] = useState("");
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  const paymentOptions = [
    { value: "Paid", label: t("Paid") },
    { value: "COD", label: t("COD") },
  ];
  const handlePaymentTypeChange = (selectedOption) => {
    setPaymentType(selectedOption);
    if (selectedOption.value === "Paid") {
      setAmount(0);
    }
  };

  const handleAmountChange = (e) => {
    if (paymentType.value !== "Paid") {
      setAmount(e.target.value);
    }
  };
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const countries = useSelector((store) => store.ajax.countries);
  const states = useSelector((store) => store.ajax.states);
  const cities = useSelector((store) => store.ajax.cities);
  const places = useSelector((store) => store.ajax.places);
  const shippers = useSelector((store) => store.ajax.shippers);
  const merchants = useSelector((store) => store.ajax.merchants);
  const consignees = useSelector((store) => store.ajax.consignees);
  const governorates = useSelector((store) => store.ajax.governorates);

  const units = useSelector((store) => store.ajax.units);

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!governorates) dispatch(getGovernorates());

    if (!states) dispatch(getStates());
    if (!cities) dispatch(getCities());
    if (!places) dispatch(getPlaces());
    if (!shippers) dispatch(getShippers());
    if (!merchants) dispatch(getMerchants());
    if (!consignees) dispatch(getConsignees());
    if (!units) dispatch(getUnits());

    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
      setCountryValue({ value: defaultCountry.id, label: defaultCountry.name });
    }
  }, [countries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);

      if (isWalkinCustomer) {
        if (!customerName || !customerPhone || !customerIdCard) {
          toast.error(
            "Please fill out all required fields: Name, Phone, and ID Card."
          );
          setIsLoading(false);
          return;
        }
      }

      if (isWalkinCustomer) {
        let is_walkin = true;
        form.append("is_walkin", is_walkin);
        form.append("customer_name", customerName);
        form.append("customer_phone", customerPhone);
        form.append("customer_id_card", customerIdCard);
        console.log("is_walkin", is_walkin);
      }

      // If the user manually modifies the name, email, or other fields, these values will be submitted
      form.append("name", name);
      form.append("email", email);
      form.append("phone", phone);
      form.append("alternatePhone", alternatePhone);
      form.append("streetAddress", streetAddress);
      form.append("country_id", countryValue?.value);
      form.append("state_id", stateValue?.value);
      form.append("city_id", cityValue?.value);

      const response = await axiosMerchant.post(`shipments/store`, form);
      toast.success(response.data.message);
      navigate("/shipments", {state: { from: "/ordres/create" }});
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);

    if (value.label === "Egypt") {
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) =>
            governorate.country_id?.toString() == value.value.toString()
        )
      );
    } else {
      // Fetch only States for other countries
      setFilteredGovernorates([]);
      setFilteredPlaces([]);
      setFilteredStates(
        states?.filter(
          (state) => state.country_id?.toString() == value.value.toString()
        )
      );
    }
  };

  const setGovernorateValue = (value) => {
    _setGovernorateValue(value);
    setFilteredStates(
      states?.filter(
        (state) => state.governorate_id?.toString() == value.value.toString()
      )
    );
  };

  const setStateValue = (value) => {
    _setStateValue(value);

    if (countryValue?.label === "Egypt") {
      setFilteredPlaces(
        places?.filter(
          (place) => place.state_id?.toString() == value.value.toString()
        )
      );
    } else {
      setFilteredCities(
        cities?.filter(
          (city) => city.state_id.toString() == value.value.toString()
        )
      );
    }
  };

  const [name, setName] = useState("");
  const [recipientData, setRecipientData] = useState(null);

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

    // Clear the previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set a new timeout for the search function to be triggered after 500ms
    const timeoutId = setTimeout(() => {
      debouncedSearch(value);
    }, 500); // 500ms delay

    // Save the timeout ID so we can clear it later
    setDebounceTimeout(timeoutId);
  };

  const handleSelectRecipient = (recipient) => {
    // Set the new values based on the selected recipient

    setName(recipient.name);
    setEmail(recipient.email);
    setPhone(recipient.cellphone);
    setAlternatePhone(recipient.alternatePhone);
    setStreetAddress(recipient.streetAddress);
    setZipcode(recipient.zipcode);
    // setGovernorateValue(recipient.governorate_id);
    // setStateValue(recipient.state_id);

    setRecipientData(null);

    // Find the corresponding country, state, and city from the store based on IDs
    const selectedCountry = countries.find(
      (country) => country.id === recipient.country_id
    );
    const selectedState = states.find(
      (state) => state.id === recipient.state_id
    );
    const selectedCity = cities.find((city) => city.id === recipient.city_id);

    // Only set the value if the selected country, state, or city is found
    if (selectedCountry) {
      setCountryValue({
        value: selectedCountry.id,
        label: selectedCountry.name,
      });
    } else {
      setCountryValue(null); // Clear the country if not found
    }

    if (selectedState) {
      setStateValue({
        value: selectedState.id,
        label: selectedState.name,
      });
    } else {
      setStateValue(null); // Clear the state if not found
    }

    if (selectedCity) {
      setCityValue({
        value: selectedCity.id,
        label: selectedCity.name,
      });
    } else {
      setCityValue(null); // Clear the city if not found
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
    setCountryValue(null);
    setStateValue(null);
    setCityValue(null);
  };

  const handleAddItem = () => {
    setItemRows([...itemRows, { id: Date.now(), value: "" }]);
  };

  const handleRemoveItem = (id) => {
    setItemRows(itemRows.filter((row) => row.id !== id));
  };

  const canAccess = can("Outsourced Shipment create")

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create Walkin Shipment")}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              <Card className="">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("Sender")}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent>
                  {isWalkinCustomer && (
                    <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4">
                      <div className="input-container">
                        <label htmlFor="customer_name">
                          {t("Customer Name")}
                        </label>
                        <Input
                          id="customer_name"
                          name="customer_name"
                          type="text"
                          placeholder={t("Enter customer name...")}
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div className="input-container">
                        <label htmlFor="customer_phone">
                          {t("Customer Phone")}
                        </label>
                        <Input
                          id="customer_phone"
                          name="customer_phone"
                          type="text"
                          placeholder={t("Enter customer phone...")}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div className="input-container">
                        <label htmlFor="customer_id_card">
                          {t("Customer ID Card No")}
                        </label>
                        <Input
                          id="customer_id_card"
                          name="customer_id_card"
                          type="text"
                          placeholder={t("Enter ID card number...")}
                          value={customerIdCard}
                          onChange={(e) => setCustomerIdCard(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                    <div className="input-container">
                      <label htmlFor="amount">{t("Delivery Fee")}:</label>
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
                      <Select
                        name="payment_type"
                        placeholder="COD/Paid"
                        options={paymentOptions}
                        value={paymentType}
                        onChange={handlePaymentTypeChange}
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                    </div>
                    <div className="input-container">
                      <label htmlFor="amount">{t("Amount")}:</label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        placeholder="0.00"
                        step="0.0001"
                        value={amount}
                        onChange={handleAmountChange}
                        disabled={paymentType.value === "Paid"}
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
              </Card>

              <Card className="">
                <CardHeader>
                  <CardTitle>
                    {t("Recipient")}/{t("Consignee")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="input-container">
                      <label htmlFor="name">{t("Name")}</label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={handleSearch}
                        placeholder={t("Enter name to search")}
                      />
                      {recipientData && recipientData.length > 0 && (
                        <ul className="suggestion-list">
                          {recipientData.map((recipient) => (
                            <li
                              key={recipient.id}
                              className="suggestion-item"
                              onClick={() => handleSelectRecipient(recipient)}
                            >
                              {recipient.name}
                            </li>
                          ))}
                        </ul>
                      )}
                      {name && (
                        <button onClick={handleClearFields}>Clear</button>
                      )}
                    </div>

                    <div className="input-container">
                      <label htmlFor="email">
                        {t("Email")}{" "}
                        <span className="text-sm">({t("Optional")})</span>
                      </label>
                      <Input
                        id="email"
                        placeholder="your@email.com"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="input-container">
                      <label htmlFor="phone">{t("Phone")}</label>
                      <Input
                        id="phone"
                        name="cellphone"
                        placeholder="e.g. +968 9012 3456"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="input-container">
                      <label htmlFor="alternatePhone">
                        {t("Alternate Phone")}
                      </label>
                      <Input
                        id="alternatePhone"
                        name="alternatePhone"
                        placeholder="e.g. +968 9123 4567"
                        type="text"
                        value={alternatePhone}
                        onChange={(e) => setAlternatePhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                    {/* Country Selection */}
                    <div className="input-container">
                      <label htmlFor="country_id">{t("Country")}</label>
                      <Select
                        name="country_id"
                        options={countries?.map((country) => ({
                          value: country.id,
                          label: country.name,
                        }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        value={countryValue}
                        onChange={(value) => setCountryValue(value)}
                      />
                    </div>

                    {/* Show Governorate if country is Egypt */}
                    {countryValue?.label === "Egypt" && (
                      <div className="input-container">
                        <label htmlFor="governorate_id">
                          {t("governorate")}
                        </label>
                        <Select
                          name="governorate_id"
                          options={filteredGovernorates?.map((governorate) => ({
                            value: governorate.id,
                            label: `${governorate.en_name} / ${governorate.ar_name ?? ""
                              }`,
                          }))}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          value={governorateValue}
                          onChange={(value) => setGovernorateValue(value)}
                        />
                      </div>
                    )}

                    {/* State Selection (Always Show) */}
                    <div className="input-container">
                      <label htmlFor="state_id">{t("State")}</label>
                      <Select
                        name="state_id"
                        options={filteredStates?.map((state) => ({
                          value: state.id,
                          label:
                            countryValue?.label === "Egypt"
                              ? `${state.en_name} / ${state.ar_name ?? ""}`
                              : state.en_name,
                        }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        value={stateValue}
                        onChange={(value) => setStateValue(value)}
                      />
                    </div>

                    {/* Show Place if country is Egypt */}
                    {countryValue?.label === "Egypt" && (
                      <div className="input-container">
                        <label htmlFor="place_id">{t("Place")}</label>
                        <Select
                          name="place_id"
                          options={filteredPlaces?.map((place) => ({
                            value: place.id,
                            label: `${place.en_name} / ${place.ar_name ?? ""}`,
                          }))}
                          className="basic-multi-select"
                          classNamePrefix="select"
                        // value={placeValue}
                        // onChange={(value) => setPlaceValue(value)}
                        />
                      </div>
                    )}

                    {/* Show City only if the country is NOT Egypt */}
                    {countryValue?.label !== "Egypt" && (
                      <div className="input-container">
                        <label htmlFor="city_id">{t("City")}</label>
                        <Select
                          name="city_id"
                          options={filteredCities?.map((city) => ({
                            value: city.id,
                            label: city.name,
                          }))}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          value={cityValue}
                          onChange={(value) => setCityValue(value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 input-container">
                    <label htmlFor="streetAddress">{t("Zipcode")}</label>
                    <Input
                      id="zipcode"
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value)}
                      placeholder="e.g. 133"
                      name="zipcode"
                      type="text"
                    />
                  </div>
                  <div className="mt-2 input-container">
                    <label htmlFor="streetAddress">{t("Street Address")}</label>
                    <Input
                      id="streetAddress"
                      name="streetAddress"
                      type="text"
                      placeholder="e.g. Al Khuwair St 12"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-4">
              <CardHeader>
                <div className="flex flex-row justify-between align-middle">
                  <CardTitle className="self-center">
                    {t("Ra7al info")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-1 lg:grid-cols-5 gap-4 mt-2">
                  <div className="input-container">
                    <label htmlFor="width">{t("Width")}</label>
                    <Input
                      placeholder="e.g. 20 "
                      id="width"
                      name="width"
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
                      <label htmlFor="name">{t("Name")}</label>
                      <Input
                        id="name"
                        name="item_name[]"
                        placeholder={t("Enter item name...")}
                        type="text"
                      />
                    </div>
                    <div className="col-span-4 input-container">
                      <label htmlFor="category">{t("Category")}</label>
                      <Input
                        id="category"
                        placeholder={t("Type category...")}
                        name="category[]"
                        type="text"
                      />
                    </div>
                    <div className="col-span-3 input-container">
                      <label htmlFor="quantity">{t("Quantity")}</label>
                      <Input
                        id="quantity"
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
