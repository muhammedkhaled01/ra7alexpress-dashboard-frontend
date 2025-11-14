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
import { Loader2, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { getCountries, getGovernorates } from "@/stores/features/ajaxFeature";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [latLng, setLatLng] = useState(null);
  const [formData, setFormData] = useState({
    country_id: null,
    governorate_id: null,
    en_name: '',
    ar_name: '',
    lat: '',
    lng: ''
  });
  const [errors, setErrors] = useState({
    country_id: '',
    governorate_id: '',
    en_name: '',
    ar_name: '',
    lat: '',
    lng: ''
  });

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);

  const [selectedCountry, setSelectedCountry] = useState(null);

  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
  };

  useEffect(() => {
    if (!countries?.length) {
      dispatch(getCountries());
    }
    if (!governorates?.length) {
      dispatch(getGovernorates());
    }
  }, [dispatch, countries, governorates]);

  useEffect(() => {
    if (countries?.length) {
      const defaultCountry = countries.find(
        (country) => country.name === "Egypt"
      );
      setSelectedCountry(defaultCountry || null);
      if (defaultCountry) {
        setFormData(prev => ({ ...prev, country_id: defaultCountry.id }));
      }
    }
  }, [countries]);

  const validateForm = () => {
    const newErrors = {
      country_id: formData.country_id ? '' : t('Country is required'),
      governorate_id: selectedCountry?.name === "Egypt" && !formData.governorate_id ? t('Governorate is required') : '',
      en_name: formData.en_name ? '' : t('English name is required'),
      ar_name: formData.ar_name ? '' : t('Arabic name is required'),
      lat: latLng?.lat ? '' : t('Location is required'),
      lng: latLng?.lng ? '' : t('Location is required')
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
      form.append("lat", latLng?.lat);
      form.append("lng", latLng?.lng);
      const response = await axiosMerchant.post("states/store", form);
      toast.success(response.data.message);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (e) => {
    const latLng = e.latLng.toJSON();
    setLatLng(latLng);
    setLocation(`Lat: ${latLng.lat}, Lng: ${latLng.lng}`);
    reverseGeocode(latLng);
  };

  const { isLoaded } = useGoogleMaps();

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

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create State")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{t("Create State")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div>
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
                  defaultValue={
                    selectedCountry && {
                      value: selectedCountry.id,
                      label: selectedCountry.name,
                    }
                  }
                  onChange={(selected) => {
                    handleCountryChange(selected);
                    setFormData(prev => ({ ...prev, country_id: selected?.value }));
                  }}
                  placeholder={t("Select a Country")}
                  aria-label={t("Country")}
                  error={errors.country_id}
                />
                {errors.country_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
                )}
              </div>

              {selectedCountry?.name === "Egypt" && (
                <div className="input-container">
                  <label htmlFor="governorate_id">{t("governorate")} <RequiredField /></label>
                  <Select
                    name="governorate_id"
                    options={governorates?.map((governorate) => ({
                      value: governorate.id,
                      label: governorate.en_name,
                    }))}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder={t("Select a Governorate")}
                    aria-label={t("governorate")}
                    onChange={(selected) => setFormData(prev => ({ ...prev, governorate_id: selected?.value }))}
                    error={errors.governorate_id}
                  />
                  {errors.governorate_id && (
                    <p className="mt-1 text-sm text-red-500">{errors.governorate_id}</p>
                  )}
                </div>
              )}

              <div className="input-container">
                <label htmlFor="en_name">{t("englishName")} <RequiredField /></label>
                <Input
                  id="en_name"
                  name="en_name"
                  type="text"
                  value={formData.en_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, en_name: e.target.value }))}
                  placeholder={t("Enter English name...")}
                  error={errors.en_name}
                />
                {errors.en_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.en_name}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="ar_name">{t("arabicName")} <RequiredField /></label>
                <Input
                  id="ar_name"
                  name="ar_name"
                  type="text"
                  value={formData.ar_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, ar_name: e.target.value }))}
                  aria-label={t("arabicName")}
                  placeholder={t("Enter Arabic name...")}
                  error={errors.ar_name}
                />
                {errors.ar_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.ar_name}</p>
                )}
              </div>
            </div>
            <div>
              <Card className="">
                <CardHeader>
                  <div className="flex flex-row justify-between align-middle">
                    <CardTitle className="self-center">
                      {t("Location")}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoaded && (
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "300px" }}
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
                        disabled
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
