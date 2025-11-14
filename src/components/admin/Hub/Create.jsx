import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { can, handleError, isAuthorized, generateTabId } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import {
  getCities,
  getMerchants,
  getCountries,
  getGovernorates,
  getHubs,
  getPlaces,
  getStates,
} from "@/stores/features/ajaxFeature";
import { useDispatch, useSelector } from "react-redux";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
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
import { closeTab } from "@/stores/features/tabsFeature";

function HubCreate({ }) {
  const [isLoading, setIsLoading] = useState(false);
  const [itemRows, setItemRows] = useState([{ id: Date.now(), value: "" }]);
  const [formData, setFormData] = useState({
    country_id: null,
    state_id: null,
    name: ''
  });
  const [errors, setErrors] = useState({
    country_id: '',
    state_id: '',
    name: '',
    location: '',
    address: '',
    lat: '',
    lng: ''
  });

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [countryValue, _setCountryValue] = useState([]);
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [placeValue, setPlaceValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [cityValue, setCityValue] = useState(null);
  const [location, setLocation] = useState("");
  const [latLng, setLatLng] = useState(null);

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const cities = useSelector((store) => store.ajax.cities);
  const places = useSelector((store) => store.ajax.places);

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!places) dispatch(getPlaces());
    if (!cities) dispatch(getCities());

    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
      console.log(defaultCountry);
      setCountryValue({ value: defaultCountry.id, label: defaultCountry.name });
      setFormData(prev => ({ ...prev, country_id: defaultCountry.id }));
    }
  }, []);

  useEffect(() => {
    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
      setCountryValue({ value: defaultCountry.id, label: defaultCountry.name });
      setFilteredGovernorates(governorates?.filter(governorate => governorate.country_id === defaultCountry.id));
      setFormData(prev => ({ ...prev, country_id: defaultCountry.id }));
    }
  }, [countries]);

  const validateForm = () => {
    const newErrors = {
      country_id: formData.country_id ? '' : t('Country is required'),
      governorate_id: formData.governorate_id ? '' : t('Governorate is required'),
      place_id: formData.place_id ? '' : t('Place is required'),
      state_id: formData.state_id ? '' : t('State is required'),
      name: formData.name ? '' : t('Hub name is required'),
      location: location ? '' : t('Location is required'),
      address: formData.address ? '' : t('Address is required'),
      lat: latLng?.lat ? '' : t('Latitude is required'),
      lng: latLng?.lng ? '' : t('Longitude is required')
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      if (latLng) {
        form.append("lat", latLng.lat);
        form.append("lng", latLng.lng);
      }
      const response = await axiosMerchant.post("hubs/store", form);
      toast.success(response.data.message);
      dispatch(getHubs());
      // Navigate to hubs list and pass tab ID to close
      const currentTabId = generateTabId("/hubs/create-hub");
      navigate("/hubs", { state: { closeTabId: currentTabId } });
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
    setPlaceValue(null);
    setFilteredStates(
      states?.filter(
        (state) => state.governorate_id?.toString() == value.value.toString()
      )
    );
    setFormData(prev => ({ ...prev, governorate_id: value?.value }));
  };

  const setStateValue = (value) => {
    _setStateValue(value);
    setPlaceValue(null);
    setFormData(prev => ({ ...prev, state_id: value?.value }));

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

  const { isLoaded } = useGoogleMaps();

  const handleLocationChange = (event) => {
    const landmark = event.target.value;
    setLocation(landmark);
  };
  const handleMapClick = (e) => {
    const latLng = e.latLng.toJSON();
    setLatLng(latLng);
    setLocation(`Lat: ${latLng.lat}, Lng: ${latLng.lng}`);
    reverseGeocode(latLng);
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

  const canAccess = can("Hub create")

  if (!canAccess) {
    return navigate("/unauthorized");
  }


  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create Hub")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-4">
              <div className="input-container">
                <label htmlFor="name">{t("Hub Name")} <RequiredField /></label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  error={errors.name}
                  placeholder={t("Enter hub name")}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              {/* Country Selection */}
              <div className="input-container">
                <label htmlFor="country_id">{t("Country")} <RequiredField /></label>
                <Select
                  name="country_id"
                  options={countries?.map((country) => ({
                    value: country.id,
                    label: country.name,
                  }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={countryValue}
                  onChange={(value) => {
                    setCountryValue(value);
                    setGovernorateValue(null)
                    setStateValue(null)
                    setPlaceValue(null)
                    setFormData(prev => ({ ...prev, country_id: value?.value }));
                  }}
                  error={errors.country_id}
                  placeholder={t("Select a country")}
                />
                {errors.country_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
                )}
              </div>

              {/* Show Governorate if country is Egypt */}
              {countryValue?.label === "Egypt" && (
                <div className="input-container">
                  <label htmlFor="governorate_id">{t("governorate")} <RequiredField /></label>
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
                    onChange={(value) => {
                      setGovernorateValue(value)
                      setStateValue(null)
                      setPlaceValue(null)
                    }}
                    error={errors.governorate_id}
                  />
                  {errors.governorate_id && (
                    <p className="mt-1 text-sm text-red-500">{errors.governorate_id}</p>
                  )}
                </div>
              )}

              {/* State Selection (Always Show) */}
              <div className="input-container">
                <label htmlFor="state_id">{t("State")} <RequiredField /></label>
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
                  onChange={(value) => {
                    setStateValue(value);
                    setPlaceValue(null)
                    setFormData(prev => ({ ...prev, state_id: value?.value }));
                  }}
                  error={errors.state_id}
                  placeholder={t("Select a state")}
                />
                {errors.state_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
                )}
              </div>

              {/* Show Place if country is Egypt */}
              {countryValue?.label === "Egypt" && (
                <div className="input-container">
                  <label htmlFor="place_id">{t("Place")} <RequiredField /></label>
                  <Select
                    name="place_id"
                    options={filteredPlaces?.map((place) => ({
                      value: place.id,
                      label: `${place.en_name} / ${place.ar_name ?? ""}`,
                    }))}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    value={placeValue}
                    onChange={(value) => {
                      setPlaceValue(value)
                      setFormData(prev => ({ ...prev, place_id: value?.value }));
                    }}
                    error={errors.place_id}
                    placeholder={t("Select a place")}
                  />
                  {errors.place_id && (
                    <p className="mt-1 text-sm text-red-500">{errors.place_id}</p>
                  )}
                </div>
              )}

              {/* Show City only if the country is NOT Egypt */}
              {countryValue?.label !== "Egypt" && (
                <div className="input-container">
                  <label htmlFor="city_id">{t("City")} <RequiredField /></label>
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

            <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-4 mb-3">
              <div className="input-container">
                <label htmlFor="location">{t("Location")} <RequiredField /></label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  placeholder={t("Enter location address")}
                  error={errors.location}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                )}
              </div>
            </div>
            <div className="mt-2 input-container">
              <label htmlFor="address">{t("Address")} <RequiredField /></label>
              <Textarea
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                error={errors.address}
                placeholder={t("Enter hub address")}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
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
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "400px" }}
              center={latLng || { lat: 23.588, lng: 58.3829 }}
              zoom={10}
              onClick={handleMapClick}
            >
              {latLng && <Marker position={latLng} />}
            </GoogleMap>
          )}

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="lat">{t("Latitude")} <RequiredField /></label>
              <Input
                id="lat"
                name="lat"
                type="text"
                value={latLng?.lat}
                disabled
                error={errors.lat}
              />
              {errors.lat && (
                <p className="mt-1 text-sm text-red-500">{errors.lat}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="lng">{t("Longitude")} <RequiredField /></label>
              <Input
                id="lng"
                name="lng"
                type="text"
                value={latLng?.lng}
                disabled
                error={errors.lng}
              />
              {errors.lng && (
                <p className="mt-1 text-sm text-red-500">{errors.lng}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HubCreate;
