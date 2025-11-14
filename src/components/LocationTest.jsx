import { handleError } from "@/utils/helpers";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import { toast } from "react-hot-toast";
import axiosMerchant from "@/axios";
import { useDispatch, useSelector } from "react-redux";
import Select from "@/components/misc/Select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  getCountries,
  getGovernorates,
  getPlaces,
  getStates,
} from "@/stores/features/ajaxFeature";

export default function LocationTest() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState("initial");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const [latLng, setLatLng] = useState(null);
  const [location, setLocation] = useState("");
  const [showFields, setShowFields] = useState(false);
  const [shipmentData, setShipmentData] = useState(null);

  // Location selection states
  const [countryValue, setCountryValue] = useState(null);
  const [governorateValue, setGovernorateValue] = useState(null);
  const [stateValue, setStateValue] = useState(null);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [streetAddress, setStreetAddress] = useState("");

  // Get data from Redux store
  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const places = useSelector((store) => store.ajax.places);

  // Load required data
  useEffect(() => {
    const loadData = async () => {
      if (!countries) await dispatch(getCountries());
      if (!governorates) await dispatch(getGovernorates());
      if (!states) await dispatch(getStates());
      if (!places) await dispatch(getPlaces());
    };
    loadData();
  }, []);

  // Handle country change
  const handleCountryChange = useCallback((value) => {
    setCountryValue(value);
    if (value?.label === "Egypt") {
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) =>
            governorate.country_id?.toString() === value.value.toString()
        )
      );
    } else {
      setFilteredGovernorates([]);
      setFilteredPlaces([]);
      setFilteredStates(
        states?.filter(
          (state) => state.country_id?.toString() === value.value.toString()
        )
      );
    }
  }, [governorates, states]);

  // Handle governorate change
  const handleGovernorateChange = useCallback((value) => {
    setGovernorateValue(value);
    if (value) {
      setFilteredStates(
        states?.filter(
          (state) => state.governorate_id?.toString() === value.value.toString()
        )
      );
    }
  }, [states]);

  // Handle state change
  const handleStateChange = useCallback((value) => {
    setStateValue(value);
    if (value && countryValue?.label === "Egypt") {
      setFilteredPlaces(
        places?.filter(
          (place) => place.state_id?.toString() === value.value.toString()
        )
      );
    }
  }, [places, countryValue]);

  const fetchShipmentData = async () => {
    try {
      const response = await axiosMerchant.post(`shipments/show/${params.tracking_no}`);
      const shipment = response.data.data;
      setShipmentData(shipment);

      if (shipment.consignee) {
        const { consignee } = shipment;

        // Set coordinates
        if (consignee.latitude && consignee.longitude) {
          const lat = parseFloat(consignee.latitude);
          const lng = parseFloat(consignee.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            setLatLng({ lat, lng });
            reverseGeocode({ lat, lng });
          }
        }

        // Set address fields
        setStreetAddress(consignee.streetAddress || "");

        // Set country and trigger related updates
        if (consignee.country) {
          const countryVal = {
            value: consignee.country.id,
            label: consignee.country.name,
          };
          handleCountryChange(countryVal);
        }

        // Set governorate after country
        if (consignee.governorate) {
          const governorateVal = {
            value: consignee.governorate.id,
            label: `${consignee.governorate.en_name} / ${consignee.governorate.ar_name || ""}`,
          };
          handleGovernorateChange(governorateVal);
        }

        // Set state after governorate
        if (consignee.state) {
          const stateVal = {
            value: consignee.state.id,
            label: `${consignee.state.en_name} / ${consignee.state.ar_name || ""}`,
          };
          handleStateChange(stateVal);
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load shipment data
  useEffect(() => {
    if (params.tracking_no) {
      fetchShipmentData();
    }
  }, []);

  const { isLoaded } = useGoogleMaps();

  const handleMapClick = (e) => {
    const newLatLng = e.latLng.toJSON();
    setLatLng(newLatLng);
    reverseGeocode(newLatLng);
  };

  const reverseGeocode = (latLng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;
        setLocation(address);
        setStreetAddress(address);
      } else {
        toast.error("Geocoder failed");
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setLatLng({ lat, lng });
          reverseGeocode({ lat, lng });
          setShowFields(false);
          setIsLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Unable to get current location. Please enter location manually.");
          setShowFields(true);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
      setShowFields(true);
    }
  };

  const sendLocation = async () => {
    try {
      setStatus("sending");
      const response = await axiosMerchant.post(`update_shipment_location`, {
        tracking_no: params.tracking_no,
        latitude: latLng?.lat,
        longitude: latLng?.lng,
        location: location,
        country_id: countryValue?.value,
        governorate_id: governorateValue?.value,
        state_id: stateValue?.value,
        street_address: streetAddress
      });

      toast.success(response.data.message);
      setStatus("done");
    } catch (error) {
      setStatus("error");
      handleError(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-s " />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col space-y-6">
        {/* Map Section */}
        {isLoaded && (
          <div className="rounded-lg overflow-hidden shadow-lg" style={{ height: "400px" }}>
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={latLng || { lat: 23.588, lng: 58.3829 }}
              zoom={13}
              onClick={handleMapClick}
            >
              {latLng && <Marker position={latLng} draggable={true} onDragEnd={(e) => {
                const newLatLng = e.latLng.toJSON();
                setLatLng(newLatLng);
                reverseGeocode(newLatLng);
              }} />}
            </GoogleMap>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setShowFields(!showFields)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          {showFields ? "Hide Address Fields" : "Show Address Fields"}
        </button>

        {/* Current Location Button */}
        <button
          onClick={handleUseCurrentLocation}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
        >
          Use My Current Location
        </button>

        {/* Location Fields */}
        {showFields && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country Selection */}
              <div className="input-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <Select
                  name="country_id"
                  options={countries?.map((country) => ({
                    value: country.id,
                    label: country.name,
                  }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={countryValue}
                  onChange={handleCountryChange}
                />
              </div>

              {/* Governorate Selection */}
              {countryValue?.label === "Egypt" && (
                <div className="input-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Governorate
                  </label>
                  <Select
                    name="governorate_id"
                    options={filteredGovernorates?.map((governorate) => ({
                      value: governorate.id,
                      label: `${governorate.en_name} / ${governorate.ar_name ?? ""}`,
                    }))}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    value={governorateValue}
                    onChange={handleGovernorateChange}
                  />
                </div>
              )}

              {/* State Selection */}
              <div className="input-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <Select
                  name="state_id"
                  options={filteredStates?.map((state) => ({
                    value: state.id,
                    label: countryValue?.label === "Egypt"
                      ? `${state.en_name} / ${state.ar_name ?? ""}`
                      : state.en_name,
                  }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={stateValue}
                  onChange={handleStateChange}
                />
              </div>

              {/* Place Selection */}
              {countryValue?.label === "Egypt" && (
                <div className="input-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Place
                  </label>
                  <Select
                    name="place_id"
                    options={filteredPlaces?.map((place) => ({
                      value: place.id,
                      label: `${place.en_name} / ${place.ar_name ?? ""}`,
                    }))}
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>
              )}
            </div>

            {/* Street Address */}
            <div className="input-container">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <Input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter street address"
              />
            </div>
          </div>
        )}

        {/* Coordinates Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <Input
              type="text"
              value={latLng?.lat || ""}
              readOnly
              className="bg-gray-50"
            />
          </div>
          <div className="input-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <Input
              type="text"
              value={latLng?.lng || ""}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={sendLocation}
          disabled={status === "sending"}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          {status === "sending" ? "Updating Location..." : "Update Location"}
        </button>

        {/* Error Messages */}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {status === "done" && (
          <div className="p-4 bg-green-100 text-green-700 rounded">
            Location updated successfully!
          </div>
        )}
      </div>
    </div>
  );
}
