import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { can, handleError, hasRole } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import {
  getCities,
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
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import PageTitle from "../../admin/Layouts/PageTitle";
import RequiredField from '@/components/misc/RequiredField';

function MerchantBranchCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    country_id: null,
    state_id: null,
    name: '',
    contact: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({
    country_id: '',
    governorate_id: '',
    state_id: '',
    place_id: '',
    city_id: '',
    name: '',
    contact: '',
    location: '',
    status: '',
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
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [placeValue, setPlaceValue] = useState(null);
  const [cityValue, setCityValue] = useState(null);
  const [statusValue, setStatusValue] = useState({ value: 'active', label: t('Active') });
  const [location, setLocation] = useState("");
  const [latLng, setLatLng] = useState(null);

  const countries = useSelector((store) => store.ajax.countries);
  const countriesLoading = useSelector((store) => store.ajax.countriesLoading);
  const governorates = useSelector((store) => store.ajax.governorates);
  const governoratesLoading = useSelector((store) => store.ajax.governoratesLoading);
  const states = useSelector((store) => store.ajax.states);
  const statesLoading = useSelector((store) => store.ajax.statesLoading);
  const cities = useSelector((store) => store.ajax.cities);
  const citiesLoading = useSelector((store) => store.ajax.citiesLoading);
  const places = useSelector((store) => store.ajax.places);
  const placesLoading = useSelector((store) => store.ajax.placesLoading);

  const accessAbility = can("Merchant Branch create") || hasRole("Merchant");

  useEffect(() => {
    if (!accessAbility) {
      return navigate("/unauthorized");
    }

    if (!countries && !countriesLoading) dispatch(getCountries());
    if (!governorates && !governoratesLoading) dispatch(getGovernorates());
    if (!states && !statesLoading) dispatch(getStates());
    if (!places && !placesLoading) dispatch(getPlaces());
    if (!cities && !citiesLoading) dispatch(getCities());

    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
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
      setFormData(prev => ({ ...prev, country_id: defaultCountry.id }));
    }
  }, [countries]);

  const validateForm = () => {
    const newErrors = {
      country_id: formData.country_id ? '' : t('Country is required'),
      governorate_id: countryValue?.label === "Egypt" && !formData.governorate_id ? t('Governorate is required') : '',
      state_id: formData.state_id ? '' : t('State is required'),
      place_id: countryValue?.label === "Egypt" && !formData.place_id ? t('Place is required') : '',
      city_id: countryValue?.label !== "Egypt" && !formData.city_id ? t('City is required') : '',
      name: formData.name ? '' : t('Branch name is required'),
      contact: formData.contact ? '' : t('Contact number is required'),
      location: location ? '' : t('Location is required'),
      status: formData.status ? '' : t('Status is required'),
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
      const response = await axiosMerchant.post("merchant/branches/store", form);
      toast.success(response.data.message);
      navigate("/merchant/branches", { state: { from: "/merchant/branches/create-branch" } });
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

  const statusOptions = [
    { value: 'active', label: t('Active') },
    { value: 'inactive', label: t('Inactive') }
  ];

  return (
    <div>
      <PageTitle title={t("Create Branch")} />
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        <Card className="">
          <CardHeader>
            <CardTitle>{t("Branch Information")}</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="input-container">
                  <label htmlFor="name">{t("Branch Name")} <RequiredField /></label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    error={errors.name}
                    placeholder={t("Enter branch name")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="input-container">
                  <label htmlFor="contact">{t("Contact Number")} <RequiredField /></label>
                  <Input
                    id="contact"
                    name="contact"
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                    error={errors.contact}
                    placeholder={t("Enter contact number")}
                  />
                  {errors.contact && (
                    <p className="mt-1 text-sm text-red-500">{errors.contact}</p>
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
                        label: `${governorate.en_name} / ${governorate.ar_name ?? ""}`,
                      }))}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      value={governorateValue}
                      onChange={(value) => {
                        setGovernorateValue(value);
                        setFormData(prev => ({ ...prev, governorate_id: value?.value }));
                      }}
                      error={errors.governorate_id}
                      placeholder={t("Select a governorate")}
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
                        setPlaceValue(value);
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
                      onChange={(value) => {
                        setCityValue(value);
                        setFormData(prev => ({ ...prev, city_id: value?.value }));
                      }}
                      error={errors.city_id}
                      placeholder={t("Select a city")}
                    />
                    {errors.city_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.city_id}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-4 mb-3">
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

                <div className="input-container">
                  <label htmlFor="status">{t("Status")} <RequiredField /></label>
                  <Select
                    name="status"
                    options={statusOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    value={statusValue}
                    onChange={(value) => {
                      setStatusValue(value);
                      setFormData(prev => ({ ...prev, status: value?.value }));
                    }}
                    error={errors.status}
                    placeholder={t("Select status")}
                  />
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-500">{errors.status}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => navigate("/merchant/branches")}
              >
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("Create Branch")
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
                  value={latLng?.lat || ''}
                  readOnly
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
                  value={latLng?.lng || ''}
                  readOnly
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
    </div>
  );
}

export default MerchantBranchCreate;
