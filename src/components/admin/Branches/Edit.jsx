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
  getPlaces,
  getStates,
  getHubs,
  getBranches,
  getStations,
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
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import Loader from "@/components/Loader";
import { closeTab } from "@/stores/features/tabsFeature";

function BranchEdit() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    country_id: null,
    state_id: null,
    governorate_id: null,
    place_id: null,
    city_id: null,
    station_id: null,
    hub_id: null,
    name: '',
    address: ''
  });
  const [errors, setErrors] = useState({
    country_id: '',
    state_id: '',
    name: '',
    location: '',
    address: '',
    hub_id: '',
    station_id: '',
    lat: '',
    lng: ''
  });

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [countryValue, setCountryValue] = useState(null);
  const [governorateValue, setGovernorateValue] = useState(null);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [stateValue, setStateValue] = useState(null);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [cityValue, setCityValue] = useState(null);
  const [placeValue, setPlaceValue] = useState(null);
  const [hubValue, setHubValue] = useState(null);
  const [stationValue, setStationValue] = useState(null);
  const [location, setLocation] = useState("");
  const [latLng, setLatLng] = useState(null);

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const cities = useSelector((store) => store.ajax.cities);
  const places = useSelector((store) => store.ajax.places);
  const hubs = useSelector((store) => store.ajax.hubs);
  const stations = useSelector((store) => store.ajax.stations);

  // Fetch branch data
  useEffect(() => {
    if (id) {
      fetchBranchData();
    }
  }, [id]);

  const fetchBranchData = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`branches/show/${id}`);
      const branch = response.data.data;

      // Set form data
      setFormData({
        country_id: branch.country_id,
        governorate_id: branch.governorate_id,
        state_id: branch.state_id,
        place_id: branch.place_id,
        city_id: branch.city_id,
        station_id: branch.station_id,
        hub_id: branch.hub_id,
        name: branch.name,
        address: branch.address
      });

      // Set location and coordinates
      setLocation(branch.location);
      if (branch.lat && branch.lng) {
        setLatLng({
          lat: parseFloat(branch.lat),
          lng: parseFloat(branch.lng)
        });
      }

    } catch (error) {
      handleError(error);
      navigate("/branches", { state: { from: "/branches/edit-branch" } });
    } finally {
      setLoading(false);
    }
  };

  // Set select values based on branch data when dependencies are available
  useEffect(() => {
    if (!formData.country_id || !countries || !states || !places || !cities || !governorates || !hubs || !stations) {
      console.log('Missing dependencies:', {
        country_id: formData.country_id,
        countries: !!countries,
        states: !!states,
        places: !!places,
        cities: !!cities,
        governorates: !!governorates,
        hubs: !!hubs,
        stations: !!stations
      });
      return;
    }

    console.log('Setting select values with formData:', formData);

    // Set country
    const country = countries.find(c => c.id === formData.country_id);
    if (country) {
      setCountryValue({ value: country.id, label: country.name });
      console.log('Set country:', country);
    }

    // Set governorate
    if (formData.governorate_id) {
      const governorate = governorates.find(g => g.id === formData.governorate_id);
      if (governorate) {
        setGovernorateValue({
          value: governorate.id,
          label: `${governorate.en_name} / ${governorate.ar_name ?? ""}`
        });
        console.log('Set governorate:', governorate);
      }
    }

    // Set state
    if (formData.state_id) {
      const state = states.find(s => s.id === formData.state_id);
      if (state) {
        const stateLabel = country?.name === "Egypt"
          ? `${state.en_name} / ${state.ar_name ?? ""}`
          : state.en_name;
        setStateValue({ value: state.id, label: stateLabel });
        console.log('Set state:', state, 'with label:', stateLabel);
      }
    }

    // Set place
    if (formData.place_id) {
      const place = places.find(p => p.id === formData.place_id);
      if (place) {
        setPlaceValue({ value: place.id, label: `${place.en_name} / ${place.ar_name ?? ""}` });
        console.log('Set place:', place);
      }
    }

    // Set city
    if (formData.city_id) {
      const city = cities.find(c => c.id === formData.city_id);
      if (city) {
        setCityValue({ value: city.id, label: city.name });
        console.log('Set city:', city);
      }
    }

    // Set hub
    if (formData.hub_id) {
      const hub = hubs.find(h => h.id === formData.hub_id);
      if (hub) {
        setHubValue({ value: hub.id, label: hub.name });
        console.log('Set hub:', hub);
      }
    }

    // Set station
    if (formData.station_id) {
      const station = stations.find(s => s.id === formData.station_id);
      if (station) {
        setStationValue({ value: station.id, label: station.name });
        console.log('Set station:', station);
      }
    }

    // Set filtered data based on country
    if (country?.name === "Egypt") {
      setFilteredGovernorates(
        governorates.filter(
          (governorate) => governorate.country_id?.toString() === country.id.toString()
        )
      );

      if (formData.state_id) {
        setFilteredPlaces(
          places.filter(
            (place) => place.state_id?.toString() === formData.state_id.toString()
          )
        );
      }
    } else if (country) {
      setFilteredStates(
        states.filter(
          (state) => state.country_id?.toString() === country.id.toString()
        )
      );

      if (formData.state_id) {
        setFilteredCities(
          cities.filter(
            (city) => city.state_id?.toString() === formData.state_id.toString()
          )
        );
      }
    }

    // Set filtered stations based on hub
    if (formData.hub_id) {
      setFilteredStations(
        stations.filter(
          (station) => station.hub_id?.toString() === formData.hub_id.toString()
        )
      );
    }

  }, [formData.country_id, formData.state_id, formData.hub_id, countries, states, places, cities, governorates, hubs, stations]);

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!places) dispatch(getPlaces());
    if (!cities) dispatch(getCities());
    if (!hubs) dispatch(getHubs());
    if (!stations) dispatch(getStations());
  }, [countries, governorates, states, places, cities, hubs, stations, dispatch]);

  const validateForm = () => {
    const newErrors = {
      country_id: formData.country_id ? '' : t('Country is required'),
      governorate_id: formData.governorate_id ? '' : t('Governorate is required'),
      place_id: formData.place_id ? '' : t('Place is required'),
      state_id: formData.state_id ? '' : t('State is required'),
      name: formData.name ? '' : t('Branch name is required'),
      location: location ? '' : t('Location is required'),
      address: formData.address ? '' : t('Address is required'),
      hub_id: formData.hub_id ? '' : t('Hub is required'),
      station_id: formData.station_id ? '' : t('Station is required'),
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
      form.append("id", id);
      if (latLng) {
        form.append("lat", latLng.lat);
        form.append("lng", latLng.lng);
      }
      const response = await axiosMerchant.post("branches/update", form);
      toast.success(response.data.message);
      dispatch(getBranches());
      // Navigate to branches list and pass tab ID to close
      const currentTabId = generateTabId(`/branches/edit-branch/${id}`);
      navigate("/branches", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (value) => {
    setCountryValue(value);
    setGovernorateValue(null);
    setStateValue(null);
    setPlaceValue(null);

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

  const handleGovernorateChange = (value) => {
    setGovernorateValue(value);
    setStateValue(null);
    setPlaceValue(null);
    setFilteredStates(
      states?.filter(
        (state) => state.governorate_id?.toString() == value.value.toString()
      )
    );
  };

  const handleStateChange = (value) => {
    setStateValue(value);
    setPlaceValue(null);

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

  const handleHubChange = (value) => {
    setHubValue(value);
    setFilteredStations(
      stations?.filter(
        (station) => station.hub_id?.toString() == value.value.toString()
      )
    );
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

  const canAccess = can("Branch update")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Edit Branch")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-4">
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
                    handleCountryChange(value);
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
                      handleGovernorateChange(value);
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
                    handleStateChange(value);
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

            <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-4 mb-3">
              <div className="input-container">
                <label htmlFor="location">{t("Location")} <RequiredField /></label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  error={errors.location}
                  placeholder={t("Enter location address")}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              <div className="mt-2">
                <div className="input-container">
                  <label htmlFor="hub">{t("Hub")} <RequiredField /></label>
                  <Select
                    name="hub_id"
                    options={hubs?.map((hub) => ({
                      value: hub.id,
                      label: hub.name,
                    }))}
                    value={hubValue}
                    onChange={(value) => {
                      handleHubChange(value);
                      setFormData(prev => ({ ...prev, hub_id: value?.value }));
                    }}
                    error={errors.hub_id}
                    placeholder={t("Select a hub...")}
                  />
                  {errors.hub_id && (
                    <p className="mt-1 text-sm text-red-500">{errors.hub_id}</p>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className="input-container">
                  <label htmlFor="station">{t("Station")} <RequiredField /></label>
                  <Select
                    name="station_id"
                    options={filteredStations?.map((station) => ({
                      value: station.id,
                      label: station.name,
                    }))}
                    value={stationValue}
                    onChange={(value) => {
                      setStationValue(value);
                      setFormData(prev => ({ ...prev, station_id: value?.value }));
                    }}
                    error={errors.station_id}
                    placeholder={t("Select a station...")}
                  />
                  {errors.station_id && (
                    <p className="mt-1 text-sm text-red-500">{errors.station_id}</p>
                  )}
                </div>
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
                placeholder={t("Enter branch address")}
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
                t("Update Branch")
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

export default BranchEdit;
