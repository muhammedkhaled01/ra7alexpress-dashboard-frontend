import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import PhoneInput from "@/components/misc/PhoneInput";
import RequiredField from "@/components/misc/RequiredField";
import {
  Building2,
  Globe,
  Hash,
  Loader2,
  Mail,
  Map as MapIcon,
  MapPin,
  Smartphone,
} from "lucide-react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import {
  ALIASES,
  bestFuzzy,
  norm,
  normalizeArabic,
  normalizeNumber,
} from "@/utils/helpers";

export default function RecipientForm({
  value,
  onChange,
  errors = {},
  lists,
  consignees = [],
  clients = [], // Added for merchant support
  entityType = "consignee", // New param: "consignee" (default) or "merchant"
  searchBy = "phone",
  defaultCountryName = "Egypt",
  showMap = true,
  title,
  onStateChange,
}) {
  const { t } = useTranslation();
  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef(null);
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);
  // const phoneInputRef = useRef(null);

  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const geoTimerRef = useRef(null);
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

  const suggestionsRef = useRef(null);
  const phoneInputRef = useRef(null); // فوكس للإنبوت
  const [phoneCountryIso, setPhoneCountryIso] = useState("eg"); // بلد PhoneInput

  // خريطة من كود الاتصال للـ ISO
  const DIAL_TO_ISO = {
    968: "eg",
    971: "ae",
    966: "sa",
    974: "qa",
    973: "bh",
    965: "kw",
    20: "eg",
    964: "iq",
    962: "jo",
    963: "sy",
    961: "lb",
    212: "ma",
    213: "dz",
    216: "tn",
    218: "ly",
    // زوّد اللي محتاجه
  };

  const deriveIsoFromPhone = (full) => {
    const digits = String(full || "").replace(/\D+/g, "");
    // نجرب الأطول الأول
    const keys = Object.keys(DIAL_TO_ISO).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (digits.startsWith(k)) return DIAL_TO_ISO[k];
    }
    return null;
  };

  const isEgypt = value?.country?.label === defaultCountryName;
  const onlyDigits = (s) => String(s || "").replace(/\D+/g, "");
  const stripLeadingCountryCode = (full, cc) => {
    const n = onlyDigits(full);
    const c = onlyDigits(cc);
    return c && n.startsWith(c) ? n.slice(c.length) : n;
  };
  const update = (patchOrFn) => {
    if (typeof patchOrFn === "function") {
      onChange?.((prev) => patchOrFn(prev));
    } else {
      onChange?.((prev) => ({ ...prev, ...patchOrFn }));
    }
  };
  function ts(dateLike) {
    if (!dateLike) return 0;
    const d = new Date(dateLike);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  // بنختار أحدث عنوان حسب ترتيب أولويات معقول
  function rankAddress(a) {
    // أعلى أولوية: updated_at -> approved_at -> last_used_at -> created_at
    return Math.max(
      ts(a?.updated_at),
      ts(a?.approved_at),
      ts(a?.last_used_at),
      ts(a?.created_at)
    );
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setSuggestions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!value?.country && countries?.length) {
      const def = countries.find((c) => c.name === defaultCountryName);
      if (def) {
        update({ country: { value: def.id, label: def.name } });
      }
    }
  }, [countries]);
  useEffect(() => {
    console.log("raw consignees prop:", consignees);
    if (consignees && consignees.length) {
      // print fully the first item to inspect all keys
      console.log(
        "first consignee full object:",
        JSON.stringify(consignees[0], null, 2)
      );
    }
  }, [consignees]);

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

  useEffect(() => {
    if (mapRef.current && value?.latLng) {
      mapRef.current.panTo(value.latLng);
    }
  }, [value?.latLng]);

  useEffect(() => {
    if (value?.latLng) {
      setLatInput(value.latLng.lat);
      setLngInput(value.latLng.lng);
    } else {
      setLatInput("");
      setLngInput("");
    }
  }, [value?.latLng]);

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
    update((prev) => ({
      ...prev,
      latLng: next,
      location: `Lat: ${lat}, Lng: ${lng}`,
    }));
    reverseGeocode(next);
  };

  const onCoordKeyDown = (e) => {
    if (e.key === "Enter") applyLatLng();
  };

  const handleMapClick = (e) => {
    const next = e.latLng?.toJSON?.();
    if (!next) return;
    update((prev) => ({
      ...prev,
      latLng: next,
      location: `Lat: ${next.lat}, Lng: ${next.lng}`,
    }));
    reverseGeocode(next);
  };

  const geocodeFreeText = (query, { force = false } = {}) => {
    if (!query || !window.google?.maps) return;

    if (!force) {
      if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
      geoTimerRef.current = setTimeout(
        () => geocodeFreeText(query, { force: true }),
        500
      );
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    const req = { address: query };

    if ((value?.country?.label || defaultCountryName) === defaultCountryName) {
      req.componentRestrictions = { country: "OM" };
    }

    geocoder.geocode(req, (results, status) => {
      if (status !== "OK" || !results?.length) {
        toast.error(t("Couldn't locate this address/Plus Code"));
        return;
      }

      const best = results[0];
      const loc = best.geometry?.location?.toJSON?.();
      if (!loc) {
        toast.error(t("No coordinates found for this location"));
        return;
      }

      update((prev) => ({
        ...prev,
        latLng: loc,
        location: best.formatted_address || query,
      }));

      if (mapRef.current) mapRef.current.panTo(loc);

      reverseGeocode(loc);
    });
  };

  const reverseGeocode = (latLng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        toast.error(t("Geocoder failed"));
        return;
      }

      const best = results[0];
      update((prev) => ({ ...prev, location: best.formatted_address }));

      const comps = best.address_components || [];

      const countryName = pickComponent(comps, "country");
      const govName = pickComponent(comps, "administrative_area_level_1");
      const stateName =
        pickComponent(comps, "administrative_area_level_2") ||
        pickComponent(comps, "locality") ||
        pickComponent(comps, "administrative_area_level_3");

      const selectedCountry = matchCountry(countries, countryName);
      const isEgypt = selectedCountry?.name === (defaultCountryName || "Egypt");

      let selectedGovernorate = null;
      let selectedState = null;

      if (isEgypt) {
        selectedGovernorate = matchGovernorate(
          governorates,
          selectedCountry?.id,
          govName
        );

        if (!selectedGovernorate) {
          update((prev) => ({
            ...prev,
            country: null,
            governorate: null,
            state: null,
          }));
          return;
        }

        selectedState = matchState(
          states,
          {
            countryId: selectedCountry?.id,
            governorateId: selectedGovernorate?.id,
          },
          stateName,
          true
        );

        if (!selectedState) {
          update((prev) => ({
            ...prev,
            country: {
              value: selectedCountry.id,
              label: selectedCountry.name,
            },
            governorate: {
              value: selectedGovernorate.id,
              label: `${selectedGovernorate.en_name} / ${
                selectedGovernorate.ar_name ?? ""
              }`,
            },
            state: null,
          }));
          return;
        }
      } else {
        selectedState = matchState(
          states,
          { countryId: selectedCountry?.id },
          stateName,
          false
        );

        if (!selectedState) {
          update((prev) => ({
            ...prev,
            country: null,
            state: null,
          }));
          return;
        }
      }

      update((prev) => ({
        ...prev,
        country: selectedCountry
          ? { value: selectedCountry.id, label: selectedCountry.name }
          : prev.country,
        governorate:
          isEgypt && selectedGovernorate
            ? {
                value: selectedGovernorate.id,
                label: `${selectedGovernorate.en_name} / ${
                  selectedGovernorate.ar_name ?? ""
                }`,
              }
            : isEgypt
            ? null
            : prev.governorate,
        state: selectedState
          ? {
              value: selectedState.id,
              label: isEgypt
                ? `${selectedState.en_name} / ${selectedState.ar_name ?? ""}`
                : selectedState.en_name,
            }
          : prev.state,
        place: null,
        city: null,
      }));

      if (selectedState && onStateChange) {
        onStateChange({
          value: selectedState.id,
          label: selectedState.en_name,
        });
      }
    });
  };

  function matchGovernorate(governorates, countryId, name) {
    if (!governorates?.length || !countryId || !name) return null;

    const n = norm(name);
    const list = governorates.filter(
      (g) => String(g.country_id) === String(countryId)
    );

    let hit =
      list.find(
        (g) =>
          norm(g.en_name) === n ||
          normalizeArabic(g.ar_name) === normalizeArabic(name)
      ) ||
      list.find(
        (g) =>
          n.includes(norm(g.en_name)) || n.includes(normalizeArabic(g.ar_name))
      );

    if (hit) return hit;

    const alias = ALIASES[name.toLowerCase()];
    if (alias) {
      hit = list.find((g) => norm(g.en_name) === norm(alias));
      if (hit) return hit;
    }

    return bestFuzzy(list, name, (g) => [g.en_name, g.ar_name]);
  }

  function matchState(states, { countryId, governorateId }, name, isEgypt) {
    if (!states?.length || !name) return null;

    const n = norm(name);
    let list = states;
    if (governorateId) {
      list = list.filter(
        (s) => String(s.governorate_id) === String(governorateId)
      );
    } else if (countryId) {
      list = list.filter((s) => String(s.country_id) === String(countryId));
    }

    let hit =
      list.find(
        (s) =>
          norm(s.en_name) === n ||
          normalizeArabic(s.ar_name) === normalizeArabic(name)
      ) ||
      list.find((s) => {
        const en = norm(s.en_name).replace(/^(al|as)\s+/, "");
        return (
          n.includes(en) ||
          en.includes(n) ||
          n.includes(normalizeArabic(s.ar_name))
        );
      });

    if (hit) return hit;

    const alias = ALIASES[name.toLowerCase()];
    if (alias) {
      hit = list.find((s) => norm(s.en_name) === norm(alias));
      if (hit) return hit;
    }

    return bestFuzzy(
      list,
      name,
      (s) => {
        const en = s.en_name;
        const ar = s.ar_name;
        const tokens = (en ? en.split(/[-\s]/) : []).concat(
          ar ? ar.split(/[-\s]/) : []
        );
        return [en, ar, ...tokens];
      },
      0.72
    );
  }

  function pickComponent(components, type) {
    const c = components.find((c) => c.types?.includes(type));
    return c?.long_name || c?.short_name || "";
  }

  function matchCountry(countries, name) {
    if (!countries?.length || !name) return null;
    const n = norm(name);
    return (
      countries.find((c) => norm(c.name) === n) ||
      countries.find((c) => n.includes(norm(c.name))) ||
      null
    );
  }

  const handlePhoneChange = (val) => {
    update({ phone: val });

    // اضبط ISO لو قدرنا نستنتجه من الرقم
    const iso = deriveIsoFromPhone(val);
    if (iso) setPhoneCountryIso(iso);

    if (searchBy !== "phone") return;
    if (!val) return setSuggestions(null);

    const filtered =
      entityType === "client"
        ? clients.filter((c) =>
            (String(c.country_code ?? "") + String(c.phone ?? "")).includes(val)
          )
        : consignees.filter((c) =>
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
    const filtered =
      entityType === "merchant"
        ? clients.filter((c) =>
            c.name?.toLowerCase().includes(val.toLowerCase())
          )
        : consignees.filter((c) =>
            c.name?.toLowerCase().includes(val.toLowerCase())
          );
    setSuggestions(filtered.length ? filtered : null);
  };

  const applyEntity = (r) => {
    // رقم التليفون الكامل
    const selectedPhone =
      entityType === "client"
        ? String(r.country_code ?? "") + String(r.phone ?? "")
        : String(r.country_key_cellphone ?? "") + String(r.cellphone ?? "");

    // ISO للبلد من الرقم + fallback من اسم البلد لو لزم
    let iso = deriveIsoFromPhone(selectedPhone);
    if (!iso) {
      const fallbackCountryName =
        r?.country?.name ||
        r?.country_name ||
        r?.address?.country?.name ||
        r?.deliveryAddress?.country?.name ||
        r?.delivery_address?.country?.name;
      if (fallbackCountryName) {
        const low = fallbackCountryName.toLowerCase();
        if (low.includes("egypt")) iso = "eg";
        else if (low.includes("saudi")) iso = "sa";
        else if (low.includes("united arab") || low.includes("uae")) iso = "ae";
        else if (low.includes("qatar")) iso = "qa";
        else if (low.includes("egypt")) iso = "eg";
      }
    }

    // هنوحّد مصدر العنوان
    const addr = pickAddressObject(r) || {};

    // Resolve Country
    const countryHit = resolveByIdOrName(
      countries,
      {
        id: addr.country_id ?? r?.country_id,
        obj: addr.country ?? r?.country,
        name: addr.country?.name || r?.country_name,
      },
      { nameKeys: ["name"] }
    );

    // هل البلد عمان؟
    const isEgyptLocal =
      (countryHit?.name || "").toLowerCase() ===
      (defaultCountryName || "egypt").toLowerCase();

    // Resolve Governorate/State/Place/City
    const governorateHit = isEgyptLocal
      ? resolveByIdOrName(
          governorates,
          {
            id: addr.governorate_id ?? r?.governorate_id,
            obj: addr.governorate ?? r?.governorate,
            name: addr.governorate?.en_name || addr.governorate?.ar_name,
          },
          { nameKeys: ["en_name", "ar_name"] }
        )
      : null;

    const stateHit = resolveByIdOrName(
      states,
      {
        id: addr.state_id ?? r?.state_id,
        obj: addr.state ?? r?.state,
        name: addr.state?.en_name || addr.state?.ar_name,
      },
      { nameKeys: ["en_name", "ar_name"] }
    );

    const placeHit = isEgyptLocal
      ? resolveByIdOrName(
          places,
          {
            id: addr.place_id ?? r?.place_id,
            obj: addr.place ?? r?.place,
            name: addr.place?.en_name || addr.place?.ar_name,
          },
          { nameKeys: ["en_name", "ar_name"] }
        )
      : null;

    const cityHit = !isEgyptLocal
      ? resolveByIdOrName(
          cities,
          {
            id: addr.city_id ?? r?.city_id,
            obj: addr.city ?? r?.city,
            name: addr.city?.name,
          },
          { nameKeys: ["name"] }
        )
      : null;

    // Street/Zip/Location/LatLng
    const streetAddress =
      addr.streetAddress && String(addr.streetAddress).toLowerCase() !== "null"
        ? addr.streetAddress
        : r?.streetAddress && String(r?.streetAddress).toLowerCase() !== "null"
        ? r?.streetAddress
        : value?.streetAddress ?? "";

    const zipcode = addr.zipcode ?? r?.zipcode ?? value?.zipcode ?? "";

    const latNum =
      addr.latitude != null
        ? Number(addr.latitude)
        : r?.latitude != null
        ? Number(r?.latitude)
        : null;
    const lngNum =
      addr.longitude != null
        ? Number(addr.longitude)
        : r?.longitude != null
        ? Number(r?.longitude)
        : null;

    const latLng =
      Number.isFinite(latNum) && Number.isFinite(lngNum)
        ? { lat: latNum, lng: lngNum }
        : value?.latLng || null;

    // لو مفيش location جاهز، نبنيه من العناصر اللي لقيناها
    const builtLocParts = [
      streetAddress || null,
      (placeHit && placeHit.en_name) || null,
      (stateHit && stateHit.en_name) || null,
      (governorateHit && governorateHit.en_name) || null,
      (countryHit && countryHit.name) || null,
    ].filter(Boolean);

    const location =
      addr.location ||
      r?.location ||
      (builtLocParts.length ? builtLocParts.join(", ") : value?.location || "");

    const next = {
      ...value,
      // بيانات أساسية
      name: r?.name ?? value?.name,
      email: r?.email ?? value?.email,
      phone: selectedPhone,
      alternatePhone:
        entityType === "client"
          ? value?.alternatePhone ?? ""
          : String(r?.country_key_cellphone ?? "") +
            String(r?.alternatePhone ?? ""),

      // العنوان
      streetAddress,
      zipcode,

      country: countryHit ? toOption(countryHit, (c) => c.name) : null,

      governorate:
        isEgyptLocal && governorateHit
          ? toOption(governorateHit, (g) => `${g.en_name} / ${g.ar_name ?? ""}`)
          : isEgyptLocal
          ? null
          : value?.governorate || null,

      state: stateHit
        ? toOption(stateHit, (s) =>
            isEgyptLocal ? `${s.en_name} / ${s.ar_name ?? ""}` : s.en_name
          )
        : null,

      place:
        isEgyptLocal && placeHit
          ? toOption(placeHit, (p) => `${p.en_name} / ${p.ar_name ?? ""}`)
          : null,

      city: !isEgyptLocal && cityHit ? toOption(cityHit, (c) => c.name) : null,

      // اللوكيشن والإحداثيات
      location,
      latLng,
    };

    onChange?.(next);
    setSuggestions(null);

    if (iso) setPhoneCountryIso(iso);
    try {
      phoneInputRef.current?.focus?.();
    } catch (_) {}

    if (stateHit && onStateChange) {
      onStateChange({ value: stateHit.id, label: stateHit.en_name });
    }
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
        <CardTitle>
          {title ||
            (entityType === "merchant"
              ? t("Merchant")
              : `${t("Recipient")}/${t("Consignee")}`)}
        </CardTitle>
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
              <ul ref={suggestionsRef} className="suggestion-list">
                {suggestions.map((r) => (
                  <li
                    key={r.id}
                    className="suggestion-item"
                    onClick={() => applyEntity(r)}
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
              country={phoneCountryIso} // بدل "eg" الثابتة
              value={value?.phone ?? ""}
              onChange={handlePhoneChange}
              enableSearch={true}
              error={errors?.phone}
              inputClass="!bg-background !text-foreground"
              buttonClass="!bg-muted"
              inputRef={phoneInputRef} // عشان الـfocus
            />

            {searchBy === "phone" && suggestions && (
              <ul ref={suggestionsRef} className="suggestion-list">
                {suggestions.map((r, idx) => {
                  // استخراج بيانات العنوان
                  const address = r.address;
                  const locationText =
                    [
                      address?.place?.en_name,
                      address?.state?.en_name,
                      address?.governorate?.en_name,
                    ]
                      .filter(Boolean)
                      .join(" / ") || "Location Details Missing";

                  return (
                    <li
                      key={`${r.phoneDisplay}-${address?.id}-${idx}`}
                      className="suggestion-item p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex flex-col items-start transition-colors duration-200"
                      onClick={() => applyEntity(r)}
                    >
                      <div className="flex items-center justify-between gap-1 w-full mb-1">
                        <span className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center">
                          <Smartphone className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                          {r.phoneDisplay}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-blue-500" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {r?.name || t("Consignee Name")}
                          </span>
                        </span>
                      </div>
                      {entityType !== "merchant" && (
                        <div className="text-xs text-gray-600 dark:text-gray-300 w-full grid grid-cols-1 gap-y-1 mt-1">
                          <span className="flex items-center col-span-1">
                            <MapIcon className="w-3 h-3 mr-1 text-orange-500" />
                            <span className="font-semibold mr-1">
                              {t("Address")}:
                            </span>
                            {address?.streetAddress || t("Not specified")}
                          </span>
                          <span className="flex items-center col-span-1 ml-5">
                            <span className="font-semibold mr-1">
                              {t("Location")}:
                            </span>
                            {locationText}
                          </span>
                          {address?.zipcode && (
                            <span className="flex items-center col-span-1 ml-5">
                              <span className="font-semibold mr-1">
                                {t("Zipcode")}:
                              </span>
                              {address.zipcode}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
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
            onChange={(e) => {
              const q = e.target.value;
              update({ location: q });
              geocodeFreeText(q);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                geocodeFreeText(e.currentTarget.value, { force: true });
              }
            }}
            onBlur={(e) => {
              const q = e.target.value?.trim();
              if (q) geocodeFreeText(q, { force: true });
            }}
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
                  onLoad={onMapLoad}
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
              type="number"
              step="any"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              onKeyDown={onCoordKeyDown}
              placeholder={t("Latitude")}
            />
          </div>
          <div className="input-container">
            <label htmlFor="longitude">{t("Longitude")}</label>
            <Input
              id="longitude"
              name="longitude"
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
  );
}
