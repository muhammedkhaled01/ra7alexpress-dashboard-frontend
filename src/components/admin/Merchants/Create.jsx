import React, { useRef, useCallback, useEffect, useState } from "react";
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
import { Loader2, Plus, Trash2Icon, Eye, EyeOff } from "lucide-react";
import { can, handleError, isAuthorized, generateTabId } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import {
  getCities,
  getMerchants,
  getCountries,
  getGovernorates,
  getPlaces,
  getStates,
} from "@/stores/features/ajaxFeature";
import { useDispatch, useSelector } from "react-redux";
import Select from "@/components/misc/Select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import RequiredField from "@/components/misc/RequiredField";
import PhoneInput, { isPhoneValid } from "@/components/misc/PhoneInput";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

function MerchantCreate({ onSubmitSuccess }) {
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contactNo, setContactNo] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    username: "",
    email: "",
    contact_no: "",
    country_id: "",
    governorate_id: "",
    state_id: "",
    address: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    contact_no: "",
    country_id: "",
    governorate_id: "",
    state_id: "",
    address: "",
    password: "",
  });

  // Helper to evaluate password strength
  const getPasswordStrength = (password) => {
    let strength = 0;
    const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    rules.forEach((rule) => rule.test(password) && strength++);
    return strength;
  };

  useEffect(() => {
    setStrength(getPasswordStrength(formData.password));
  }, [formData.password]);

  const strengthColors = [
    { label: t("Very Weak"), color: "bg-red-500" },
    { label: t("Weak"), color: "bg-orange-500" },
    { label: t("Fair"), color: "bg-yellow-500" },
    { label: t("Good"), color: "bg-blue-500" },
    { label: t("Strong"), color: "bg-green-500" },
  ];

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [latLng, setLatLng] = useState(null);

  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const mapRef = useRef(null);
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const [countryValue, _setCountryValue] = useState([]);
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [placeValue, setPlaceValue] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const places = useSelector((store) => store.ajax.places);

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!places) dispatch(getPlaces());

    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
      console.log(defaultCountry);
      _setCountryValue({
        value: defaultCountry.id,
        label: defaultCountry.name,
      });
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) =>
            governorate.country_id?.toString() === defaultCountry.id.toString()
        )
      );
    }
  }, [countries, governorates]);

  useEffect(() => {
    if (mapRef.current && latLng) {
      mapRef.current.panTo(latLng);
    }
  }, [latLng]);

  useEffect(() => {
    if (latLng) {
      setLatInput(latLng.lat);
      setLngInput(latLng.lng);
    } else {
      setLatInput("");
      setLngInput("");
    }
  }, [latLng]);

  const applyLatLng = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    const valid =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    if (!valid) {
      toast.error(
        t(
          "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180."
        )
      );
      return;
    }

    const next = { lat, lng };
    setLatLng(next);
    setLocation(`Lat: ${lat}, Lng: ${lng}`);
    reverseGeocode(next);
  };

  const onCoordKeyDown = (e) => {
    if (e.key === "Enter") applyLatLng();
  };

  const resetForm = () => {
    setContactNo("");
    setLatLng(null);
    setLocation("");
    setErrors({
      name: "",
      username: "",
      email: "",
      contact_no: "",
      country_id: "",
      governorate_id: "",
      state_id: "",
      address: "",
    });
    _setCountryValue([]);
    _setGovernorateValue([]);
    _setStateValue([]);
    setFilteredGovernorates([]);
    setFilteredStates([]);
    setFilteredPlaces([]);
  };

  const validateForm = (form) => {
    const newErrors = {
      name: form.get("name") ? "" : t("Merchant Name is required"),
      // email: form.get("email") ? "" : t("Merchant email is required"),
      contact_no:
        contactNo && isPhoneValid(contactNo)
          ? ""
          : t("Merchant phone is required with valid phone number"),
      country_id: form.get("country_id") ? "" : t("Merchant Country is required"),
      governorate_id: form.get("governorate_id")
        ? ""
        : t("Merchant Governorate is required"),
      state_id: form.get("state_id") ? "" : t("Merchant State is required"),
      address: form.get("address") ? "" : t("Merchant Address is required"),
      password: form.get("password") ? "" : t("Password is required"),
    };
    const password = form.get("password");
    if (password && password.length < 8) {
      newErrors.password = t("Password must be at least 8 characters");
    } else if (password && strength < 3) {
      newErrors.password = t("Password is too weak");
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);

    try {
      form.append("contact_no", contactNo);
      form.append("lat", latLng?.lat ?? "");
      form.append("lng", latLng?.lng ?? "");
      const response = await axiosMerchant.post("merchants/store", form);
      toast.success(response.data.message);
      await dispatch(getMerchants());
      resetForm();
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      // Navigate to merchants list and pass tab ID to close
      const currentTabId = generateTabId("/merchants/create-merchant");
      navigate("/merchants", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);
    _setGovernorateValue(null);
    _setStateValue(null);
    setPlaceValue(null);
    setFilteredGovernorates(
      governorates?.filter(
        (governorate) =>
          governorate.country_id?.toString() == value.value.toString()
      )
    );
  };

  const setGovernorateValue = (value) => {
    _setGovernorateValue(value);
    _setStateValue(null);
    setPlaceValue(null);
    setFilteredStates(
      states?.filter(
        (state) => state.governorate_id?.toString() == value.value.toString()
      )
    );
    setFilteredPlaces([]);
  };

  const setStateValue = (value) => {
    _setStateValue(value);
    setPlaceValue(null);
    setFilteredPlaces(
      places?.filter(
        (place) => place.state_id?.toString() == value.value.toString()
      )
    );
  };

  const { isLoaded } = useGoogleMaps();

  // const handleMapClick = (e) => {
  //   const latLng = e.latLng.toJSON();
  //   setLatLng(latLng);
  //   setLocation(`Lat: ${latLng.lat}, Lng: ${latLng.lng}`);
  //   reverseGeocode(latLng);
  // };
  const handleMapClick = (e) => {
    const next = e.latLng.toJSON();
    setLatLng(next);
    setLatInput(next.lat);
    setLngInput(next.lng);
    setLocation(`Lat: ${next.lat}, Lng: ${next.lng}`);
    reverseGeocode(next);
  };

  // Reverse Geocoding function to get the location name
  const reverseGeocode = (latLng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;
        setLocation(address); // Set the location input to the address
      } else {
        toast.error(t("Geocoder failed"));
      }
    });
  };

  const canAccess = can("Merchant create");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create Merchant")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              <div className="input-container">
                <label htmlFor="name">
                  {t("Name")} <RequiredField />
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t("Enter merchant name")}
                  error={errors.name}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="username">
                  {t("Username")} <RequiredField />
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t("Enter merchant username")}
                  error={errors.username}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="email">{t("Email")}</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("Enter email")}
                  error={errors.email}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              <div className="input-container">
                <label htmlFor="contact_no">
                  {t("Contact Number")} <RequiredField />
                </label>
                <PhoneInput
                  country={"eg"}
                  value={contactNo}
                  name="phone"
                  onChange={setContactNo}
                  enableSearch={true}
                  inputClass="!bg-background !text-foreground"
                  error={errors.phone}
                  buttonClass="!bg-muted"
                />
                <input type="hidden" name="contact_no" value={contactNo} />
                {errors.contact_no && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.contact_no}
                  </p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="facility_to_facility_fees">
                  {t("Facility to Facility Delivery Fees")}
                </label>
                <Input
                  id="facility_to_facility_fees"
                  name="facility_to_facility_fees"
                  type="number"
                  step="0.01"
                  placeholder={t("Enter delivery fees")}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
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
                  placeholder={t("Select Country...")}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={countryValue}
                  onChange={(value) => {
                    setCountryValue(value);
                    setGovernorateValue(null);
                    setStateValue(null);
                    setPlaceValue(null);
                  }}
                  error={errors.country_id}
                />
                {errors.country_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.country_id}
                  </p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="governorate_id">
                  {t("governorate")} <RequiredField />
                </label>
                <Select
                  name="governorate_id"
                  options={filteredGovernorates?.map((governorate) => ({
                    value: governorate.id,
                    label: `${governorate.en_name} / ${governorate.ar_name}`,
                  }))}
                  placeholder={t("Select Governorate...")}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={governorateValue}
                  onChange={(value) => {
                    setGovernorateValue(value);
                    setStateValue(null);
                    setPlaceValue(null);
                  }}
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
                    label: `${state.en_name} / ${state.ar_name}`,
                  }))}
                  placeholder={t("Select State...")}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={stateValue}
                  onChange={(value) => {
                    setStateValue(value);
                    setPlaceValue(null);
                  }}
                  error={errors.state_id}
                />
                {errors.state_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="place_id">{t("Place")}</label>
                <Select
                  name="place_id"
                  options={filteredPlaces?.map((place) => ({
                    value: place.id,
                    label: `${place.en_name} / ${place.ar_name}`,
                  }))}
                  placeholder={t("Select Place...")}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={placeValue}
                  onChange={(value) => setPlaceValue(value)}
                />
              </div>
            </div>
            <div className="input-container mt-2">
              <label htmlFor="address">
                {t("Address")} <RequiredField />
              </label>
              <Textarea
                id="address"
                name="address"
                type="text"
                placeholder={t("Enter address")}
                error={errors.address}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
              )}
            </div>
            <div className="input-container mt-2">
              <label htmlFor="password">{t("Password")}</label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={t("e.g Aa@123456")}
                error={errors.password}
                icon={
                  <div
                    className="cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                }
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}

              {/* Password Strength Bar */}
              <AnimatePresence>
                {formData.password && (
                  <motion.div
                    className="mt-2 h-2 rounded transition-all"
                    initial={{ width: 0 }}
                    animate={{ width: `${(strength / 5) * 100}%` }}
                    exit={{ width: 0 }}
                  >
                    <div
                      className={clsx(
                        "h-full rounded",
                        strengthColors[strength - 1]?.color || "bg-gray-300"
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Strength Label */}
              {formData.password && (
                <p className="text-sm mt-1 text-muted-foreground">
                  {t(strengthColors[strength - 1]?.label || "Too Short")}
                </p>
              )}

              {/* Guidelines */}
              {formData.password && (
                <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5 space-y-1">
                  <li>{t("At least 8 characters")}</li>
                  <li>{t("Include uppercase and lowercase letters")}</li>
                  <li>{t("Include numbers")}</li>
                  <li>{t("Include special characters (!@#$%)")}</li>
                </ul>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="mt-4 ml-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Save Changes")
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <Card className="">
        <CardHeader>
          <div className="flex flex-row justify-between align-middle">
            <CardTitle className="self-center">{t("Location")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-4 mb-3">
            <div className="input-container">
              <label htmlFor="location">{t("Location")}</label>
              <Input
                id="location"
                name="location"
                type="text"
                value={location}
                onChange={handleLocationChange}
                required
              />
            </div>
          </div> */}
          {/* {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "400px" }}
              center={latLng || { lat: 23.588, lng: 58.3829 }}
              zoom={10}
              onClick={handleMapClick}
            >
              {latLng && <Marker position={latLng} />}
            </GoogleMap>
          )} */}

          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "400px" }}
              center={latLng || { lat: 23.588, lng: 58.3829 }}
              zoom={10}
              onClick={handleMapClick}
              onLoad={onMapLoad}
            >
              {latLng && <Marker position={latLng} />}
            </GoogleMap>
          )}

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="lat">{t("Latitude")}</label>
              <Input
                id="lat"
                name="lat"
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onKeyDown={onCoordKeyDown}
                placeholder={t("Latitude")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="lng">{t("Longitude")}</label>
              <Input
                id="lng"
                name="lng"
                type="number"
                step="any"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onKeyDown={onCoordKeyDown}
                placeholder={t("Longitude")}
              />
            </div>
          </div>
          <div className="mt-2">
            <Button type="button" onClick={applyLatLng}>
              {t("Apply Coordinates")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MerchantCreate;
