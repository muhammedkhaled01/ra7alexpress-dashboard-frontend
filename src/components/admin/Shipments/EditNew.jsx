import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

import Select from "@/components/misc/Select";

import {
  getCities,
  getCountries,
  getStates,
  getPlaces,
  getGovernorates,
} from "@/stores/features/ajaxFeature";

import { handleError } from "@/utils/helpers";
import { updateShipment } from "@/stores/features/shipmentFeature";
import { Input } from "@/components/ui/input";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import PhoneInput from "@/components/misc/PhoneInput";

function TaskEditNew({
  shipment: _shipment,
  isOpen,
  setIsOpen,
  onClose,
  onSubmitSuccess,
}) {
  const { loading: loadingShipment } = useSelector((state) => state.shipment);
  const [isLoading, setIsLoading] = useState(false);
  const [shipment, setShipment] = useState(_shipment);
  const mapRef = useRef(null);
  const [countryValue, setCountryValue] = useState(null);
  const [stateValue, setStateValue] = useState(null);
  const [placeValue, setPlaceValue] = useState(null);
  const [errors, setErrors] = useState({});
  const [cityValue, setCityValue] = useState(null);
  const [governorateValue, _setGovernorateValue] = useState(null);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [consigneeName, setConsigneeName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address, setAddress] = useState("");
  const [latLng, setLatLng] = useState(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [location, setLocation] = useState("");

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const countries = useSelector((store) => store.ajax.countries);
  const states = useSelector((store) => store.ajax.states);
  const cities = useSelector((store) => store.ajax.cities);
  const places = useSelector((store) => store.ajax.places);
  const governorates = useSelector((store) => store.ajax.governorates);

  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    setIsLoading(loadingShipment);
  }, [loadingShipment]);

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!states) dispatch(getStates());
    if (!governorates) dispatch(getGovernorates());
    if (!cities) dispatch(getCities());
    if (!places) dispatch(getPlaces());

    if (isOpen && _shipment) {
      if (!countries) dispatch(getCountries());
      if (!states) dispatch(getStates());
      if (!governorates) dispatch(getGovernorates());
      if (!cities) dispatch(getCities());
      if (!places) dispatch(getPlaces());
      setShipment(_shipment);
      const addr = _shipment?.delivery_address;
      setCountryValue(
        addr?.country
          ? { value: addr.country.id, label: addr.country.name }
          : null
      );
      setGovernorateValue(
        addr?.governorate
          ? {
              value: addr.governorate.id,
              label: `${addr.governorate.en_name ?? ""} - ${
                addr.governorate.ar_name ?? ""
              }`,
            }
          : null
      );
      setStateValue(
        addr?.state
          ? {
              value: addr.state.id,
              label: `${addr.state.en_name ?? ""} - ${
                addr.state.ar_name ?? ""
              }`,
            }
          : null
      );
      setCityValue(
        addr?.city ? { value: addr.city.id, label: addr.city.name } : null
      );
      setPlaceValue(
        addr?.place
          ? {
              value: addr.place.id,
              label: `${addr.place.en_name ?? ""} - ${
                addr.place.ar_name ?? ""
              }`,
            }
          : null
      );

      const customerFullPhone = `${
        _shipment?.consignee?.country_key_cellphone || ""
      }${_shipment?.consignee?.cellphone || ""}`;
      const alternateFullPhone = `${
        _shipment?.consignee?.country_key_alternatePhone || ""
      }${_shipment?.consignee?.alternatePhone || ""}`;

      setConsigneeName(_shipment?.consignee?.name || "");
      setCustomerNumber(customerFullPhone);
      setAlternatePhone(alternateFullPhone);
      const initialStreet =
        addr?.streetAddress ??
        _shipment?.streetAddress ??
        _shipment?.consignee?.streetAddress ??
        "";
      setAddress(initialStreet);
      setLocation(
        addr?.location_url ??
          _shipment?.location_url ??
          _shipment?.consignee?.location ??
          ""
      );

      const rawLat =
        addr?.latitude ?? _shipment?.latitude ?? _shipment?.consignee?.latitude;
      const rawLng =
        addr?.longitude ?? _shipment?.longitude ?? _shipment?.consignee?.longitude;
      if (rawLat && rawLng) {
        const lat = Number(rawLat);
        const lng = Number(rawLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          setLatLng({ lat, lng });
          setLatInput(String(lat));
          setLngInput(String(lng));
        }
      } else {
        if (initialStreet) {
          geocodeAddress(initialStreet);
        }
      }
    }
  }, [
    isOpen,
    _shipment,
    dispatch,
    countries,
    states,
    cities,
    places,
    governorates,
  ]);

  useEffect(() => {
    if (countryValue && governorates?.length) {
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) => governorate.country_id === countryValue.value
        )
      );
    }
  }, [countryValue, governorates]);

  useEffect(() => {
    if (governorateValue && states?.length) {
      setFilteredStates(
        states?.filter(
          (state) => state.governorate_id === governorateValue.value
        )
      );
    }
  }, [governorateValue, states]);

  useEffect(() => {
    if (stateValue) {
      setFilteredCities(
        cities?.filter((city) => city.state_id === stateValue.value)
      );
      setFilteredPlaces(
        places?.filter((place) => place.state_id === stateValue.value)
      );
    }
  }, [stateValue, cities, places]);

  const setGovernorateValue = (value) => {
    _setGovernorateValue(value);
    setStateValue(null);
    setCityValue(null);
    setPlaceValue(null);
  };

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
    },
    [isLoaded]
  );

  const panTo = useCallback((coords) => {
    if (mapRef.current && coords?.lat && coords?.lng) {
      mapRef.current.panTo(coords);
      mapRef.current.setZoom(15);
    } else {
      //
    }
  }, []);

  useEffect(() => {
    if (latLng) {
      panTo(latLng);
    }
  }, [latLng, panTo]);

  const applyLatLngFromInputs = () => {
    const lat = Number(latInput.trim());
    const lng = Number(lngInput.trim());
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const next = { lat, lng };
      setLatLng(next);
      setLocation(`Lat: ${lat}, Lng: ${lng}`);
      reverseGeocode(next);
    } else {
      toast.error(t("Please enter valid latitude and longitude"));
    }
  };

  const handleMapClick = (e) => {
    const p = e.latLng.toJSON();
    setLatLng(p);
    setLocation(`Lat: ${p.lat}, Lng: ${p.lng}`);
    reverseGeocode(p);
    setLatInput(String(p.lat));
    setLngInput(String(p.lng));
  };

  const geocodeAddress = (addr) => {
    if (!addr || !window?.google?.maps) {
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: addr }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location.toJSON();
        setLatLng(loc);
        setLatInput(String(loc.lat));
        setLngInput(String(loc.lng));
        setLocation(results[0].formatted_address || addr);
      } else {
        toast.error(t("Address not found"));
      }
    });
  };

  const reverseGeocode = (latLng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;
        setLocation(address);
      } else {
        toast.error(t("Geocoder failed"));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    try {
      const newErrors = {};
      if (!countryValue) newErrors.country = t("Country is required");
      if (!governorateValue)
        newErrors.governorate = t("Governorate is required");
      if (!stateValue) newErrors.state = t("State is required");
      if (!consigneeName) newErrors.name = t("Name is required");
      if (!customerNumber) newErrors.cellphone = t("Cell phone is required");
      if (!address) newErrors.streetAddress = t("Street address is required");
      if (!location) newErrors.location = t("Location is required");
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error(t("Check required inputs"));
        setIsLoading(false);
        return;
      }
      const form = new FormData();
      form.set("country_id", countryValue?.value || "");
      form.set("governorate_id", governorateValue?.value || "");
      form.set("state_id", stateValue?.value || "");
      form.set("place_id", placeValue?.value || "");
      form.set("name", consigneeName);
      form.set("cellphone", customerNumber);
      form.set("alternatePhone", alternatePhone);
      form.set("streetAddress", address);
      form.set("location_url", location);
      form.set("longitude", latLng?.lng || "");
      form.set("latitude", latLng?.lat || "");
      await dispatch(updateShipment({ form, id: shipment?.id })).unwrap();
      onClose();
      onSubmitSuccess();
      toast.success(t("Shipment updated successfully!"));
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[1000px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t("Edit Shipment")}: {shipment?.tracking_no}
          </SheetTitle>
        </SheetHeader>
        <form id="edit-shipment-form" onSubmit={handleSubmit}>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country_id">{t("Country")}</label>
                  <Select
                    name="country_id"
                    options={countries?.map((country) => ({
                      value: country.id,
                      label: country.name,
                    }))}
                    error={errors?.country}
                    value={countryValue}
                    onChange={setCountryValue}
                  />
                </div>
                <div>
                  <label htmlFor="governorate_id">{t("Governorate")}</label>
                  <Select
                    name="governorate_id"
                    options={filteredGovernorates?.map((governorate) => ({
                      value: governorate.id,
                      label: `${governorate.en_name} - ${governorate.ar_name}`,
                    }))}
                    error={errors.governorate}
                    value={governorateValue}
                    onChange={setGovernorateValue}
                  />
                </div>
                <div>
                  <label htmlFor="state_id">{t("State")}</label>
                  <Select
                    name="state_id"
                    options={filteredStates?.map((state) => ({
                      value: state.id,
                      label: `${state.en_name} - ${state.ar_name}`,
                    }))}
                    error={errors.state}
                    value={stateValue}
                    onChange={setStateValue}
                  />
                </div>
                <div>
                  <label htmlFor="place_id">{t("Place")}</label>
                  <Select
                    name="place_id"
                    options={filteredPlaces?.map((place) => ({
                      value: place.id,
                      label: `${place.en_name} - ${place.ar_name}`,
                    }))}
                    value={placeValue}
                    onChange={setPlaceValue}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="input-container">
                  <label htmlFor="name">{t("Consignee Name")}</label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    className="input-container w-full border rounded px-3 py-2"
                    value={consigneeName}
                    onChange={(e) => setConsigneeName(e.target.value)}
                    required
                    placeholder={t("Enter Consignee Name")}
                  />
                  {errors.name && (
                    <span className="text-red-500 text-xs">{errors.name}</span>
                  )}
                </div>
                <div className="input-container">
                  <label htmlFor="cellphone">{t("Cell phone")}</label>
                  <PhoneInput
                    country={"eg"}
                    value={customerNumber}
                    onChange={setCustomerNumber}
                    enableSearch={true}
                    inputClass="!bg-background !text-foreground"
                    buttonClass="!bg-muted"
                  />
                  {errors.cellphone && (
                    <span className="text-red-500 text-xs">
                      {errors.cellphone}
                    </span>
                  )}
                </div>
                <div className="input-container">
                  <label htmlFor="alternatePhone">
                    {t("Alternative Phone")}
                  </label>
                  <PhoneInput
                    country={"eg"}
                    value={alternatePhone}
                    onChange={setAlternatePhone}
                    enableSearch={true}
                    inputClass="!bg-background !text-foreground"
                    buttonClass="!bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="input-container">
                  <label htmlFor="streetAddress">{t("Street address")}</label>
                  <Input
                    id="streetAddress"
                    name="streetAddress"
                    type="text"
                    className="input-container w-full border rounded px-3 py-2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder={t("Enter street address...")}
                  />
                  {errors.streetAddress && (
                    <span className="text-red-500 text-xs">
                      {errors.streetAddress}
                    </span>
                  )}
                </div>
                <div className="input-container">
                  <label htmlFor="location">{t("Location")}</label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    className="input-container w-full border rounded px-3 py-2"
                    value={location}
                    onChange={handleLocationChange}
                    required
                    placeholder={t("Enter location...")}
                  />
                  {errors.location && (
                    <span className="text-red-500 text-xs">
                      {errors.location}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block mb-2">{t("Location")}</label>
                {isLoaded ? (
                  <div className="h-64 w-full">
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={
                        latLng
                          ? { lat: Number(latLng.lat), lng: Number(latLng.lng) }
                          : { lat: 23.588, lng: 58.3829 }
                      }
                      zoom={latLng ? 15 : 10}
                      onClick={handleMapClick}
                      onLoad={onMapLoad}
                    >
                      {latLng &&
                      Number.isFinite(latLng.lat) &&
                      Number.isFinite(latLng.lng) ? (
                        <>
                          <Marker
                            key={`${latLng.lat}-${latLng.lng}`}
                            position={{
                              lat: Number(latLng.lat),
                              lng: Number(latLng.lng),
                            }}
                          />
                        </>
                      ) : (
                        console.log(
                          "[DEBUG] Marker not rendered: invalid latLng",
                          latLng
                        )
                      )}
                    </GoogleMap>
                  </div>
                ) : (
                  <div className="h-64 w-full flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="input-container">
                  <label htmlFor="latitude">{t("Latitude")}</label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="text"
                    value={latInput}
                    onChange={(e) => {
                      setLatInput(e.target.value);
                    }}
                    placeholder={t("Latitude")}
                  />
                </div>
                <div className="input-container">
                  <label htmlFor="longitude">{t("Longitude")}</label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="text"
                    value={lngInput}
                    onChange={(e) => {
                      setLngInput(e.target.value);
                    }}
                    placeholder={t("Longitude")}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => {
                      applyLatLngFromInputs();
                    }}
                    className="w-full"
                  >
                    {t("Set on map")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
        <SheetFooter className="mt-6 flex justify-end">
          <Button type="submit" form="edit-shipment-form" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("Save Changes")
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default TaskEditNew;
