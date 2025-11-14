import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import Select from "@/components/misc/Select";
import {
  getCities,
  getCountries,
  getStates,
  getPlaces,
} from "@/stores/features/ajaxFeature";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { handleError } from "@/utils/helpers";
import { updateShipment } from "@/stores/features/shipmentFeature";
import { Input } from "@/components/ui/input";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";

function TaskEdit({ shipment: _shipment, isOpen, setIsOpen, onClose, onSubmitSuccess }) {
  const { loading: loadingShipment } = useSelector((state) => state.shipment)
  const [isLoading, setIsLoading] = useState(false);
  const [shipment, setShipment] = useState(_shipment);
  const [countryValue, setCountryValue] = useState(null);
  const [stateValue, setStateValue] = useState(null);
  const [placeValue, setPlaceValue] = useState(null);
  const [errors, setErrors] = useState({});
  const [cityValue, setCityValue] = useState(null);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  // Consignee fields
  const [consigneeName, setConsigneeName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address, setAddress] = useState("");
  const [latLng, setLatLng] = useState(null);
  const [location, setLocation] = useState("");

  const dispatch = useDispatch();
  const { t } = useTranslation();
  const countries = useSelector((store) => store.ajax.countries);
  const states = useSelector((store) => store.ajax.states);
  const cities = useSelector((store) => store.ajax.cities);
  const places = useSelector((store) => store.ajax.places);
  
  const { isLoaded } = useGoogleMaps();


  useEffect(() => {
    setIsLoading(loadingShipment);
  }, [loadingShipment]);

  useEffect(() => {
    if (!countries && isOpen) dispatch(getCountries())
    if (!states && isOpen) dispatch(getStates())
    if (!cities && isOpen) dispatch(getCities())
    if (!places && isOpen) dispatch(getPlaces())

    if (isOpen && _shipment) {
      if (!countries) dispatch(getCountries())
      if (!states) dispatch(getStates())
      if (!cities) dispatch(getCities())
      if (!places) dispatch(getPlaces())
      setShipment(_shipment);
      console.log(_shipment,'_shipment')
      setCountryValue({
        value: _shipment?.consignee?.country?.id,
        label: _shipment?.consignee?.country?.name,
      });
      setStateValue({
        value: _shipment?.consignee?.state?.id,
        label: `${_shipment?.consignee?.state?.en_name} - ${_shipment?.consignee?.state.ar_name}`
      });
      setCityValue({
        value: _shipment?.consignee?.city?.id,
        label: _shipment?.consignee?.city?.name,
      });
      setPlaceValue(_shipment?.consignee?.place ? {
        value: _shipment?.consignee?.place?.id,
        label: `${_shipment?.consignee?.place?.en_name} - ${_shipment?.consignee?.place?.ar_name}`
      } : null);
      setConsigneeName(_shipment?.consignee?.name || "");
      setCustomerNumber(_shipment?.consignee?.cellphone || "");
      setAlternatePhone(_shipment?.consignee?.alternatePhone || "");
      setAddress(_shipment?.consignee?.streetAddress || "");
      
      if (_shipment?.consignee?.latitude && _shipment?.consignee?.longitude) {
        const lat = parseFloat(_shipment.consignee.latitude);
        const lng = parseFloat(_shipment.consignee.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setLatLng({ lat, lng });
        }
      }
    }
  }, [isOpen, _shipment]);

  useEffect(() => {
    if (countryValue) {
      setFilteredStates(
        states?.filter((state) => state.country_id === countryValue.value)
      );
    }
  }, [countryValue, states]);

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

  const handleMapClick = (e) => {
    const newLatLng = e.latLng.toJSON();
    setLatLng(newLatLng);
    setLocation(`Lat: ${newLatLng.lat}, Lng: ${newLatLng.lng}`);
    reverseGeocode(newLatLng);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    try {
      const newErrors = {};
      if (!countryValue) newErrors.country = t("Country is required");
      if (!stateValue) newErrors.state = t("State is required");
      if (!consigneeName) newErrors.name = t("Name is required");
      if (!customerNumber) newErrors.cellphone = t("Cell phone is required");
      if (!address) newErrors.streetAddress = t("Street address is required");
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error(t("Check required inputs"));
        setIsLoading(false);
        return;
      }
      const form = new FormData(e.currentTarget);
      form.set("name", consigneeName);
      form.set("cellphone", customerNumber);
      form.set("alternatePhone", alternatePhone);
      form.set("streetAddress", address);
      form.set("longitude", latLng?.lng || "");
      form.set("latitude", latLng?.lat || "");
      await dispatch(updateShipment({ form, id: shipment?.id })).unwrap();
      onClose();
      onSubmitSuccess();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader>
        <ModalTitle>
          {t("Edit Shipment")}: {shipment?.tracking_no}
        </ModalTitle>
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalContent>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="input-container">
                <label htmlFor="name">{t("Consignee Name")}</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  className="input-container w-full border rounded px-3 py-2"
                  value={consigneeName}
                  onChange={e => setConsigneeName(e.target.value)}
                  required
                  placeholder={t("Enter Consignee Name")}
                />
                {errors.name && (
                  <span className="text-red-500 text-xs">{errors.name}</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-container">
                <label htmlFor="cellphone">{t("Cell phone")}</label>
                <Input
                  id="cellphone"
                  name="cellphone"
                  type="text"
                  className="input-container w-full border rounded px-3 py-2"
                  value={customerNumber}
                  onChange={e => setCustomerNumber(e.target.value)}
                  required
                  placeholder={t("Enter Cell Phone")}
                />
                {errors.cellphone && (
                  <span className="text-red-500 text-xs">{errors.cellphone}</span>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="alternatePhone">{t("Alternative Phone")}</label>
                <Input
                  id="alternatePhone"
                  name="alternatePhone"
                  type="text"
                  className="input-container w-full border rounded px-3 py-2"
                  value={alternatePhone}
                  onChange={e => setAlternatePhone(e.target.value)}
                  placeholder={t("Enter Alternative Phone")}
                />
              </div>
            </div>
            
            <div className="input-container">
              <label htmlFor="streetAddress">{t("Street address")}</label>
              <Input
                id="streetAddress"
                name="streetAddress"
                type="text"
                className="input-container w-full border rounded px-3 py-2"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
                placeholder={t("Enter street address...")}
              />
              {errors.streetAddress && (
                <span className="text-red-500 text-xs">{errors.streetAddress}</span>
              )}
            </div>
            
            <div className="mt-4">
              <label className="block mb-2">{t("Location")}</label>
              {isLoaded ? (
                <div className="h-64 w-full">
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={latLng || { lat: 23.588, lng: 58.3829 }}
                    zoom={10}
                    onClick={handleMapClick}
                  >
                    {latLng && <Marker position={latLng} />}
                  </GoogleMap>
                </div>
              ) : (
                <div className="h-64 w-full flex items-center justify-center bg-gray-100">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="input-container">
                <label htmlFor="latitude">{t("Latitude")}</label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="text"
                  value={latLng?.lat || ""}
                  readOnly
                  className="bg-gray-50"
                  placeholder={t("Latitude")}
                />
              </div>
              <div className="input-container">
                <label htmlFor="longitude">{t("Longitude")}</label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="text"
                  value={latLng?.lng || ""}
                  readOnly
                  className="bg-gray-50"
                  placeholder={t("Longitude")}
                />
              </div>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button type="submit" className="mt-4 ml-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("Save Changes")
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default TaskEdit;
