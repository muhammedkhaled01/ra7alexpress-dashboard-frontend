// src/components/shipments/RecipientForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import PhoneInput from "@/components/misc/PhoneInput";
import { Textarea } from "@/components/ui/textarea";
import RequiredField from "@/components/misc/RequiredField";
import { Loader2 } from "lucide-react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";

export default function RecipientForm({
  value,
  onChange,
  errors = {},
  lists,
  consignees = [],
  searchBy = "phone",
  defaultCountryName = "Egypt",
  showMap = true,
  title,
  onStateChange,
}) {
  const { t } = useTranslation();
  const { isLoaded } = useGoogleMaps();

  const {
    countries = [],
    governorates = [],
    states = [],
    places = [],
    cities = [],
    loading = {},
  } = lists || {};

  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [suggestions, setSuggestions] = useState(null);

  const isEgypt = value?.country?.label === defaultCountryName;

  const update = (patchOrFn) => {
    if (typeof patchOrFn === "function") {
      onChange?.((prev) => patchOrFn(prev)); // ✅ forward function
    } else {
      onChange?.((prev) => ({ ...prev, ...patchOrFn })); // ✅ merge with latest
    }
  };

  useEffect(() => {
    if (!value?.country && countries?.length) {
      const def = countries.find((c) => c.name === defaultCountryName);
      if (def) {
        update({ country: { value: def.id, label: def.name } });
      }
    }
  }, [countries]);

  useEffect(() => {
    if (isEgypt && governorates?.length && value?.country?.value) {
      setFilteredGovernorates(
        governorates.filter(
          (g) => String(g.country_id) === String(value.country.value)
        )
      );
    } else {
      setFilteredGovernorates([]);
    }
  }, [isEgypt, governorates, value?.country]);

  useEffect(() => {
    if (isEgypt && value?.governorate?.value) {
      setFilteredStates(
        states.filter(
          (s) => String(s.governorate_id) === String(value.governorate.value)
        )
      );
    } else if (!isEgypt && value?.country?.value) {
      setFilteredStates(
        states.filter(
          (s) => String(s.country_id) === String(value.country.value)
        )
      );
    } else {
      setFilteredStates([]);
    }
  }, [isEgypt, states, value?.governorate, value?.country]);

  useEffect(() => {
    if (value?.state?.value) {
      if (isEgypt) {
        setFilteredPlaces(
          places.filter((p) => String(p.state_id) === String(value.state.value))
        );
        setFilteredCities([]);
      } else {
        setFilteredCities(
          cities.filter((c) => String(c.state_id) === String(value.state.value))
        );
        setFilteredPlaces([]);
      }
    } else {
      setFilteredPlaces([]);
      setFilteredCities([]);
    }
  }, [isEgypt, places, cities, value?.state]);

  const handleMapClick = (e) => {
    const next = e.latLng?.toJSON?.();
    if (!next) return;
    // set both immediately (optimistic)
    update((prev) => ({
      ...prev,
      latLng: next,
      location: `Lat: ${next.lat}, Lng: ${next.lng}`,
    }));
    reverseGeocode(next);
  };

  const reverseGeocode = (latLng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const addr = results[0].formatted_address;
        // IMPORTANT: functional update so we don't lose latLng
        update((prev) => ({ ...prev, location: addr }));
      } else {
        toast.error(t("Geocoder failed"));
      }
    });
  };

  const handlePhoneChange = (val) => {
    update({ phone: val });
    if (searchBy !== "phone") return;
    if (!val) return setSuggestions(null);
    const filtered = consignees.filter((c) =>
      (
        String(c.country_key_cellphone ?? "") + String(c.cellphone ?? "")
      ).includes(val)
    );
    setSuggestions(filtered.length ? filtered : null);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    update({ name: val });
    if (searchBy !== "name") return;
    if (!val) return setSuggestions(null);
    const filtered = consignees.filter((c) =>
      c.name?.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(filtered.length ? filtered : null);
  };

  const applyRecipient = (r) => {
    const selectedCountry = countries.find((c) => c.id === r.country_id);
    const selectedGovernorate = governorates?.find(
      (g) => g.id === r.governorate_id
    );
    const selectedState = states.find((s) => s.id === r.state_id);
    const selectedPlace = places.find((p) => p.id === r.place_id);
    const selectedCity = cities.find((c) => c.id === r.city_id);

    const next = {
      ...value,
      name: r.name ?? value.name,
      email: r.email ?? value.email,
      phone: String(r.country_key_cellphone ?? "") + String(r.cellphone ?? ""),
      alternatePhone:
        String(r.country_key_cellphone ?? "") + String(r.alternatePhone ?? ""),
      streetAddress:
        r.streetAddress && r.streetAddress !== "null"
          ? r.streetAddress
          : value.streetAddress,
      zipcode: r.zipcode ?? value.zipcode,
      country: selectedCountry
        ? { value: selectedCountry.id, label: selectedCountry.name }
        : null,
      governorate: selectedGovernorate
        ? {
            value: selectedGovernorate.id,
            label: `${selectedGovernorate.en_name} / ${
              selectedGovernorate.ar_name ?? ""
            }`,
          }
        : null,
      state: selectedState
        ? {
            value: selectedState.id,
            label:
              selectedCountry?.name === defaultCountryName
                ? `${selectedState.en_name} / ${selectedState.ar_name ?? ""}`
                : selectedState.en_name,
          }
        : null,
      city:
        selectedCountry?.name !== defaultCountryName && selectedCity
          ? { value: selectedCity.id, label: selectedCity.name }
          : null,
      place: selectedPlace
        ? {
            value: selectedPlace.id,
            label: `${selectedPlace.en_name} / ${selectedPlace.ar_name ?? ""}`,
          }
        : null,
    };

    onChange?.(next);
    setSuggestions(null);
    if (selectedState && onStateChange)
      onStateChange({ value: selectedState.id, label: selectedState.en_name });
  };

  const onCountry = (opt) => {
    onChange?.({
      ...value,
      country: opt,
      governorate: null,
      state: null,
      place: null,
      city: null,
    });
  };
  const onGovernorate = (opt) => {
    onChange?.({ ...value, governorate: opt, state: null, place: null });
  };
  const onState = (opt) => {
    onChange?.({ ...value, state: opt, place: null, city: null });
    onStateChange?.(opt);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || `${t("Recipient")}/${t("Consignee")}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          <div className="input-container">
            <label className="dark:text-gray-400" htmlFor="name">
              {t("Name")}
              {searchBy === "name" && <RequiredField />}
            </label>
            <Input
              id="name"
              name="name"
              value={value?.name ?? ""}
              onChange={handleNameChange}
              placeholder={t("Enter full name")}
              error={errors?.name}
            />
            {searchBy === "name" && suggestions && (
              <ul className="suggestion-list">
                {suggestions.map((r) => (
                  <li
                    key={r.id}
                    className="suggestion-item"
                    onClick={() => applyRecipient(r)}
                  >
                    {r.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="input-container">
            <label className="dark:text-gray-400" htmlFor="phone">
              {t("Phone")} <RequiredField />
            </label>
            <PhoneInput
              country={"eg"}
              value={value?.phone ?? ""}
              onChange={handlePhoneChange}
              enableSearch={true}
              error={errors?.phone}
              inputClass="!bg-background !text-foreground"
              buttonClass="!bg-muted"
            />
            {searchBy === "phone" && suggestions && (
              <ul className="suggestion-list">
                {suggestions.map((r) => (
                  <li
                    key={r.id}
                    className="suggestion-item"
                    onClick={() => applyRecipient(r)}
                  >
                    {r.cellphone}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="input-container">
            <label className="dark:text-gray-400" htmlFor="alternatePhone">
              {t("Alternate Phone")}
            </label>
            <PhoneInput
              country={"eg"}
              value={value?.alternatePhone ?? ""}
              onChange={(v) => update({ alternatePhone: v })}
              enableSearch={true}
              inputClass="!bg-background !text-foreground"
              buttonClass="!bg-muted"
            />
          </div>

          <div className="input-container">
            <label className="dark:text-gray-400" htmlFor="email">
              {t("Email")}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={value?.email ?? ""}
              onChange={(e) => update({ email: e.target.value })}
              placeholder={t("Enter email")}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          <div className="input-container">
            <label className="dark:text-gray-400" htmlFor="country_id">
              {t("Country")} <RequiredField />
            </label>
            <Select
              name="country_id"
              options={countries?.map((c) => ({ value: c.id, label: c.name }))}
              value={value?.country || null}
              onChange={onCountry}
              placeholder={t("Select a country...")}
              classNamePrefix="select"
              isLoading={loading?.countriesLoading}
              error={errors?.country}
            />
          </div>

          {isEgypt && (
            <div className="input-container">
              <label className="dark:text-gray-400" htmlFor="governorate_id">
                {t("governorate")} <RequiredField />
              </label>
              <Select
                name="governorate_id"
                options={filteredGovernorates?.map((g) => ({
                  value: g.id,
                  label: `${g.en_name} / ${g.ar_name ?? ""}`,
                }))}
                value={value?.governorate || null}
                onChange={onGovernorate}
                placeholder={t("Select a governorate...")}
                classNamePrefix="select"
                isLoading={loading?.governoratesLoading}
                error={errors?.governorate}
              />
            </div>
          )}

          <div className="input-container">
            <label className="dark:text-gray-400" htmlFor="state_id">
              {t("State")} <RequiredField />
            </label>
            <Select
              name="state_id"
              options={filteredStates?.map((s) => ({
                value: s.id,
                label: isEgypt ? `${s.en_name} / ${s.ar_name ?? ""}` : s.en_name,
              }))}
              value={value?.state || null}
              onChange={onState}
              placeholder={t("Select a state...")}
              classNamePrefix="select"
              isLoading={loading?.statesLoading}
              error={errors?.state}
            />
          </div>

          {isEgypt ? (
            <div className="input-container">
              <label className="dark:text-gray-400" htmlFor="place_id">
                {t("Place")}
              </label>
              <Select
                name="place_id"
                options={filteredPlaces?.map((p) => ({
                  value: p.id,
                  label: `${p.en_name} / ${p.ar_name ?? ""}`,
                }))}
                value={value?.place || null}
                onChange={(opt) => update({ place: opt })}
                placeholder={t("Select a place...")}
                classNamePrefix="select"
                isLoading={loading?.placesLoading}
              />
            </div>
          ) : (
            <div className="input-container">
              <label className="dark:text-gray-400" htmlFor="city_id">
                {t("City")}
              </label>
              <Select
                name="city_id"
                options={filteredCities?.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={value?.city || null}
                onChange={(opt) => update({ city: opt })}
                placeholder={t("Select a city...")}
                classNamePrefix="select"
                isLoading={loading?.citiesLoading}
              />
            </div>
          )}
        </div>

        <div className="mt-2 input-container">
          <label className="dark:text-gray-400" htmlFor="zipcode">
            {t("Zipcode")}
          </label>
          <Input
            id="zipcode"
            name="zipcode"
            value={value?.zipcode ?? ""}
            onChange={(e) => update({ zipcode: e.target.value })}
            placeholder={t("e.g. 133")}
            type="text"
          />
        </div>

        <div className="mt-2 input-container">
          <label className="dark:text-gray-400" htmlFor="streetAddress">
            {t("Street Address")}
          </label>
          <Input
            id="streetAddress"
            name="streetAddress"
            value={value?.streetAddress ?? ""}
            onChange={(e) => update({ streetAddress: e.target.value })}
            placeholder={t("e.g. Al Khuwair St 12")}
            type="text"
            error={errors?.streetAddress}
          />
        </div>

        <div className="input-container mt-2">
          <label className="dark:text-gray-400" htmlFor="location">
            {t("Location")}
          </label>
          <Input
            id="location"
            name="location"
            type="text"
            value={value?.location ?? ""}
            onChange={(e) => update({ location: e.target.value })}
            placeholder={t("JF2F+V3M, Muscat, Egypt")}
          />
        </div>

        {showMap && (
          <div className="mt-4">
            <label className="block mb-2">{t("Location")}</label>
            {isLoaded ? (
              <div className="h-64 w-full">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={value?.latLng || { lat: 23.588, lng: 58.3829 }}
                  zoom={10}
                  onClick={handleMapClick}
                >
                  {value?.latLng && <Marker position={value.latLng} />}
                </GoogleMap>
              </div>
            ) : (
              <div className="h-64 w-full flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="input-container">
            <label htmlFor="latitude">{t("Latitude")}</label>
            <Input
              id="latitude"
              name="latitude"
              type="text"
              value={value?.latLng?.lat ?? ""}
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
              value={value?.latLng?.lng ?? ""}
              readOnly
              className="bg-gray-50"
              placeholder={t("Longitude")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
