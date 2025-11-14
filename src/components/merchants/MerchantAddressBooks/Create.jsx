import { useEffect, useState } from "react";
import PropTypes from "prop-types";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";

import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import {
  getCities,
  getCountries,
  getGovernorates,
  getStates,
} from "@/stores/features/ajaxFeature";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import PhoneInput from "@/components/misc/PhoneInput";

function Create({ onSubmitSuccess }) {
  Create.propTypes = {
    onSubmitSuccess: PropTypes.func,
  };

  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [countryValue, _setCountryValue] = useState({
    label: "Egypt",
    value: "165",
  });
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [cityValue, setCityValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    cellphone: "",
    country_id: "",
    governorate_id: "",
    state_id: "",
    city_id: "",
    streetAddress: "",
    latitude: "",
    longitude: "",
  });

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const cities = useSelector((store) => store.ajax.cities);

  useEffect(() => {
    if (!countries) {
      dispatch(getCountries());
    }
    if (!governorates) {
      dispatch(getGovernorates());
    }
    if (!states) {
      dispatch(getStates());
    }
    if (!cities) {
      dispatch(getCities());
    }
  }, [cities, countries, dispatch, governorates, states]);

  useEffect(() => {
    if (countryValue?.label === "Egypt" && governorates) {
      setFilteredGovernorates(
        governorates.filter(
          (governorate) =>
            governorate.country_id?.toString() ===
            countryValue.value?.toString()
        )
      );
    }
  }, [governorates, countryValue]);

  const [latitude, setLatitude] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [longitude, setLongitude] = useState("");

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 30.0444, lng: () => 31.2357 },
      radius: 200 * 1000,
    },
    debounce: 300,
  });

  useEffect(() => {
    // console.log("Ready:", ready);
    // console.log("Input value:", value);
  }, [ready, value]);

  const handleSelect = async (address) => {
    setValue(address, false);

    const result = await getGeocode({ address }); //get geocoding object
    const { lat, lng } = await getLatLng(result[0]);
    console.log(`${address} Cordinates --> lat: ${lat} lng:${lng}`);
    setLatitude(lat);
    setLongitude(lng);

    clearSuggestions();
  };

  const validateForm = (form) => {
    const newErrors = {
      name: form.get("name") ? "" : t("Consignee Name is required"),
      email: form.get("email") ? "" : t("Email is required"),
      cellphone: cellphone ? "" : t("Cell Phone is required"),
      country_id: form.get("country_id") ? "" : t("Country is required"),
      governorate_id:
        countryValue?.label === "Egypt" && !form.get("governorate_id")
          ? t("Governorate is required for Egypt")
          : "",
      state_id: form.get("state_id") ? "" : t("State is required"),
      city_id: form.get("city_id") ? "" : t("City is required"),
      streetAddress: form.get("streetAddress")
        ? ""
        : t("Street Address is required"),
      // latitude: form.get('latitude') ? '' : t('Latitude is required'),
      // longitude: form.get('longitude') ? '' : t('Longitude is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);
    try {
      form.append("governorate_id", governorateValue?.value);
      form.append("cellphone", cellphone);
      form.append("alternatePhone", alternatePhone);
      const response = await axiosMerchant.post(
        `merchant/address_book/store`,
        form
      );
      toast.success(response.data.message);
      setShowDialog(false);
      onSubmitSuccess && onSubmitSuccess();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);
    // Reset all dependent values and filters
    _setGovernorateValue(null);
    _setStateValue(null);
    setCityValue(null);
    setFilteredGovernorates(
      value?.value
        ? governorates?.filter(
            (governorate) =>
              governorate.country_id.toString() === value.value.toString()
          ) || []
        : []
    );
    setFilteredStates([]);
    setFilteredCities([]);
  };

  const setGovernorateValue = (value) => {
    _setGovernorateValue(value);
    // Reset dependent values and filters
    _setStateValue(null);
    setCityValue(null);
    setFilteredStates(
      value?.value
        ? states?.filter(
            (state) =>
              state.governorate_id.toString() === value.value.toString()
          ) || []
        : []
    );
    setFilteredCities([]);
  };

  const setStateValue = (value) => {
    _setStateValue(value);
    // Reset city value
    setCityValue(null);
    setFilteredCities(
      value?.value
        ? cities?.filter(
            (city) => city.state_id.toString() === value.value.toString()
          ) || []
        : []
    );
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Address Book")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{t("Create Address Book")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">
                {t("Name")} <RequiredField />
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t("Enter Name")}
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="email">{t("Email")} </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("Enter Email")}
                error={errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="cellphone">
                {t("Cell Phone")} <RequiredField />
              </label>
              <PhoneInput
                country="eg"
                value={cellphone}
                onChange={setCellphone}
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
                error={errors.cellphone}
              />
              {errors.cellphone && (
                <p className="mt-1 text-sm text-red-500">{errors.cellphone}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="alternatePhone">{t("Alternate Phone")}</label>
              <PhoneInput
                country="eg"
                value={alternatePhone}
                onChange={setAlternatePhone}
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
              />
            </div>
            <div className="input-container">
              <label htmlFor="district">{t("District")}</label>
              <Input
                id="district"
                name="district"
                type="text"
                placeholder={t("Enter District")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="zipcode">{t("Zip Code")}</label>
              <Input
                id="zipcode"
                name="zipcode"
                type="text"
                placeholder={t("Enter Zip Code")}
              />
            </div>
            {/* <div className="input-container">
              <label htmlFor="identify">{t("Identify")}</label>
              <Input id="identify" name="identify" type="text" />
            </div> */}
            {/* <div className="input-container">
              <label htmlFor="taxNumber">{t("Tax Number")}</label>
              <Input id="taxNumber" name="taxNumber" type="text" />
            </div> */}
          </div>
          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="country_id">
                {t("Country")} <RequiredField />
              </label>
              <Select
                name="country_id"
                options={countries?.map((country) => ({
                  value: country.id,
                  label: country.name,
                }))}
                className="basic-multi-select"
                placeholder={t("Select Country...")}
                classNamePrefix="select"
                value={countryValue}
                onChange={(value) => setCountryValue(value)}
                error={errors.country_id}
              />
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="governorate_id">
                {t("Governorate")}{" "}
                {countryValue?.label === "Egypt" && <RequiredField />}
              </label>
              <Select
                name="governorate_id"
                options={filteredGovernorates?.map((governorate) => ({
                  value: governorate.id,
                  label: governorate.en_name,
                }))}
                className="basic-multi-select"
                placeholder={t("Select Governorate...")}
                classNamePrefix="select"
                value={governorateValue}
                onChange={(value) => setGovernorateValue(value)}
                error={errors.governorate_id}
              />
              {errors.governorate_id && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.governorate_id}
                </p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="state_id">
                {t("State")} <RequiredField />
              </label>
              <Select
                name="state_id"
                options={filteredStates?.map((state) => ({
                  value: state.id,
                  label: state.en_name,
                }))}
                className="basic-multi-select"
                placeholder={t("Select State...")}
                classNamePrefix="select"
                value={stateValue}
                onChange={(value) => setStateValue(value)}
                error={errors.state_id}
              />
              {errors.state_id && (
                <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="city_id">
                {t("City")} <RequiredField />
              </label>
              <Select
                name="city_id"
                options={filteredCities?.map((city) => ({
                  value: city.id,
                  label: city.name,
                }))}
                className="basic-multi-select"
                placeholder={t("Select City...")}
                classNamePrefix="select"
                value={cityValue}
                onChange={(value) => setCityValue(value)}
                error={errors.city_id}
              />
              {errors.city_id && (
                <p className="mt-1 text-sm text-red-500">{errors.city_id}</p>
              )}
            </div>
            {/* Search Box */}
            <div className="input-container">
              <label htmlFor="map_address">{t("Search for a Place")}</label>
              <Input
                type="text"
                placeholder={t("Search for a place")}
                name="map_address"
                value={value}
                onChange={(e) => setValue(e.target.value)} // Update value on input change
                disabled={!ready} // Disable input if not ready
              />

              {/* Display suggestions */}
              {status === "OK" && (
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: "5px",
                    maxHeight: "150px",
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {data.map((suggestion) => (
                    <li
                      key={suggestion.place_id}
                      onClick={() => handleSelect(suggestion.description)}
                      style={{
                        cursor: "pointer",
                        padding: "8px 10px",
                        fontSize: "14px",
                        color: "#333",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "#fff")
                      }
                    >
                      {suggestion.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Latitude and Longitude Inputs */}

            <div className="input-container">
              <label htmlFor="latitude">{t("Latitude")}</label>
              <Input
                id="latitude"
                name="latitude"
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                readOnly={true}
                placeholder={t("Latitude")}
                error={errors.latitude}
              />
              {errors.latitude && (
                <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="longitude">{t("Longitude")}</label>
              <Input
                id="longitude"
                name="longitude"
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                readOnly={true}
                placeholder={t("Longitude")}
                error={errors.longitude}
              />
              {errors.longitude && (
                <p className="mt-1 text-sm text-red-500">{errors.longitude}</p>
              )}
            </div>
          </div>

          <div className="input-container mt-4 mb-4">
            <label htmlFor="streetAddress">
              {t("Street Address")} <RequiredField />
            </label>
            <Input
              id="streetAddress"
              name="streetAddress"
              type="text"
              placeholder={t("Enter Street Address")}
              error={errors.streetAddress}
            />
            {errors.streetAddress && (
              <p className="mt-1 text-sm text-red-500">
                {errors.streetAddress}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Save Changes")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create;
