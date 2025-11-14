import React, { useEffect, useState } from "react";
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
import { Loader2, Plus, Trash2Icon } from "lucide-react";
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
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import RequiredField from "@/components/misc/RequiredField";
import { closeTab } from "@/stores/features/tabsFeature";
import Loader from "@/components/Loader";
import PhoneInput from '@/components/misc/PhoneInput';

function MerchantEdit() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [itemRows, setItemRows] = useState([{ id: Date.now(), value: "" }]);
  const [errors, setErrors] = useState({
    name: '',
    contact_no: '',
    country_id: '',
    governorate_id: '',
    state_id: '',
    address: ''
  });

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [latLng, setLatLng] = useState(null);
  const [contactNo, setContactNo] = useState("");

  const [countryValue, setCountryValue] = useState(null);
  const [governorateValue, setGovernorateValue] = useState(null);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [stateValue, setStateValue] = useState(null);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [placeValue, setPlaceValue] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_no: '',
    facility_to_facility_fees: '',
    country_id: null,
    governorate_id: null,
    state_id: null,
    place_id: null,
    address: ''
  });

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const places = useSelector((store) => store.ajax.places);

  // Fetch merchant data
  useEffect(() => {
    if (id) {
      fetchMerchantData();
    }
  }, [id]);

  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`merchants/show/${id}`);
      const merchant = response.data.data;

      // Set form data
      setFormData({
        name: merchant.name || '',
        email: merchant.email || '',
        username: merchant.username || '',
        contact_no: String(merchant.merchant?.country_code ?? "") + String(merchant.merchant?.contact_no ?? "") || '',
        facility_to_facility_fees: merchant.merchant?.facility_to_facility_fees || '',
        country_id: merchant.merchant?.country_id || null,
        governorate_id: merchant.merchant?.governorate_id || null,
        state_id: merchant.merchant?.state_id || null,
        place_id: merchant.merchant?.place_id || null,
        address: merchant.merchant?.address || ''
      });
      setContactNo(String(merchant.merchant?.country_code ?? "") + String(merchant.merchant?.contact_no ?? "") || '');
      // Set location and coordinates
      setLocation(merchant.merchant?.location || '');
      if (merchant.merchant?.lat && merchant.merchant?.lng) {
        setLatLng({
          lat: parseFloat(merchant.merchant.lat),
          lng: parseFloat(merchant.merchant.lng)
        });
      }
    } catch (error) {
      handleError(error);
      navigate("/merchants", { state: { from: "/merchants/edit-merchant" } });
    } finally {
      setLoading(false);
    }
  };

  // Set select values based on merchant data when dependencies are available
  useEffect(() => {
    if (!formData.country_id || !countries || !states || !places || !governorates) {
      return;
    }

    // Set country
    const country = countries.find(c => c.id === formData.country_id);
    if (country) {
      setCountryValue({ value: country.id, label: country.name });
    }

    // Set governorate
    if (formData.governorate_id) {
      const governorate = governorates.find(g => g.id === formData.governorate_id);
      if (governorate) {
        setGovernorateValue({
          value: governorate.id,
          label: `${governorate.en_name} / ${governorate.ar_name ?? governorate.en_name}`
        });
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
      }
    }

    // Set place
    if (formData.place_id) {
      const place = places.find(p => p.id === formData.place_id);
      if (place) {
        setPlaceValue({ value: place.id, label: `${place.en_name} / ${place.ar_name ?? place.en_name}` });
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
    }

  }, [formData.country_id, formData.state_id, countries, states, places, governorates]);

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!places) dispatch(getPlaces());
  }, [countries, governorates, states, places, dispatch]);

  const validateForm = (form) => {
    const newErrors = {
      name: form.get('name') ? '' : t('Merchant Name is required'),
      email: form.get('email') ? '' : t('Merchant email is required'),
      contact_no: contactNo ? '' : t('Merchant Contact number is required'),
      country_id: form.get('country_id') ? '' : t('Merchant Country is required'),
      governorate_id: form.get('governorate_id') ? '' : t('Merchant Governorate is required'),
      state_id: form.get('state_id') ? '' : t('Merchant State is required'),
      address: form.get('address') ? '' : t('Merchant Address is required')
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);

    try {
      form.append("id", id);
      form.append("contact_no", contactNo);
      form.append("lat", latLng?.lat ?? "");
      form.append("lng", latLng?.lng ?? "");
      const response = await axiosMerchant.post("merchants/update", form);
      toast.success(response.data.message);
      await dispatch(getMerchants());
      // Navigate to merchants list and pass tab ID to close
      const currentTabId = generateTabId(`/merchants/edit-merchant/${id}`);
      navigate("/merchants", { state: { closeTabId: currentTabId } });
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
    setFormData(prev => ({ ...prev, country_id: value?.value }));

    if (value.label === "Egypt") {
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) =>
            governorate.country_id?.toString() == value.value.toString()
        )
      );
    } else {
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
    setFormData(prev => ({ ...prev, governorate_id: value?.value }));
    setFilteredStates(
      states?.filter(
        (state) => state.governorate_id?.toString() == value.value.toString()
      )
    );
  };

  const handleStateChange = (value) => {
    setStateValue(value);
    setPlaceValue(null);
    setFilteredPlaces([]);
    setFormData(prev => ({ ...prev, state_id: value?.value }));

    if (countryValue?.label === "Egypt") {
      setFilteredPlaces(
        places?.filter(
          (place) => place.state_id?.toString() == value.value.toString()
        )
      );
    }
  };

  const handlePlaceChange = (value) => {
    setPlaceValue(value);
    setFormData(prev => ({ ...prev, place_id: value?.value }));
  };

  const { isLoaded } = useGoogleMaps();

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

  const canAccess = can("Merchant update")

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
          <CardTitle>{t("Edit Merchant")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              <div className="input-container">
                <label htmlFor="name">{t("Name")} <RequiredField /></label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  value={formData.username}
                  placeholder={t("Enter merchant username")}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled
                  error={errors.username}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="email">{t("Email")} </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  country={'eg'}
                  value={contactNo}
                  onChange={setContactNo}
                  enableSearch={true}
                  inputClass="!bg-background !text-foreground"
                  buttonClass="!bg-muted"
                />
                {errors.contact_no && (
                  <p className="mt-1 text-sm text-red-500">{errors.contact_no}</p>
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
                  value={formData.facility_to_facility_fees}
                  onChange={(e) => setFormData(prev => ({ ...prev, facility_to_facility_fees: e.target.value }))}
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
                  onChange={(value) => handleCountryChange(value)}
                  error={errors.country_id}
                />
                {errors.country_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
                )}
              </div>
              {countryValue?.label === "Egypt" && (
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
                    onChange={(value) => handleGovernorateChange(value)}
                    error={errors.governorate_id}
                  />
                  {errors.governorate_id && (
                    <p className="mt-1 text-sm text-red-500">{errors.governorate_id}</p>
                  )}
                </div>
              )}
              <div className="input-container">
                <label htmlFor="state_id">
                  {t("State")} <RequiredField />
                </label>
                <Select
                  name="state_id"
                  options={filteredStates?.map((state) => ({
                    value: state.id,
                    label: countryValue?.label === "Egypt"
                      ? `${state.en_name} / ${state.ar_name}`
                      : state.en_name,
                  }))}
                  placeholder={t("Select State...")}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={stateValue}
                  onChange={(value) => handleStateChange(value)}
                  error={errors.state_id}
                />
                {errors.state_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
                )}
              </div>
              {countryValue?.label === "Egypt" && (
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
                    onChange={(value) => handlePlaceChange(value)}
                  />
                </div>
              )}
            </div>
            <div className="input-container mt-2">
              <label htmlFor="address">
                {t("Address")} <RequiredField />
              </label>
              <Textarea
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder={t("Enter address")}
                error={errors.address}
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
                t("Update Merchant")
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
              <label htmlFor="lat">{t("Latitude")}</label>
              <Input
                id="lat"
                name="lat"
                type="text"
                value={latLng?.lat}
                disabled
                placeholder={t("Latitude")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="lng">{t("Longitude")}</label>
              <Input
                id="lng"
                name="lng"
                type="text"
                value={latLng?.lng}
                disabled
                placeholder={t("Longitude")}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MerchantEdit;
