import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getGovernorates,
  getPlaces,
  getStates,
  getZones,
} from "@/stores/features/ajaxFeature";
import Select from "@/components/misc/Select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import ZoneMap from "@/components/misc/Zones/ZoneMap";

function ZoneCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [polygonCoords, setPolygonCoords] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { places, placesLoading, governorates, states, zones } = useSelector(
    (store) => store.ajax
  );
  console.log(states, "states");
  const [formData, setFormData] = useState({ name: "" });
  const [errors, setErrors] = useState({
    name: "",
    coordinates: "",
    owner_type: "",
    owner_id: "",
  });
  const [placeValue, setPlaceValue] = useState([]);
  const [governorateValue, setGovernorateValue] = useState(null);
  const [stateValue, setStateValue] = useState(null);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [stateObject, setStateObject] = useState(null);
  const [multiStates, setMultiStates] = useState(false);
  
  const [minOverlapPct, setMinOverlapPct] = useState(0.03);
  const OWNER_TYPES = [
    { value: "station", label: t("Station") },
    { value: "hub", label: t("Hub") },
    { value: "branch", label: t("Branch") },
  ];
  const [ownerType, setOwnerType] = useState(null);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [ownerValue, setOwnerValue] = useState(null);
  const GROUP_TO_TYPE = {
    Stations: "station",
    Hubs: "hub",
    Branches: "branch",
  };
  useEffect(() => {
    setPolygonCoords([]);
    setFormData({ name: "" });
    setErrors({ name: "", coordinates: "" });
    if (!places && !placesLoading) dispatch(getPlaces());
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!zones) dispatch(getZones());
  }, []);

  const handleStateChange = async (selected) => {
    const stateId = selected?.value;
    const label = selected?.label;

    if (!stateId) return;

    try {
      const res = await axiosMerchant.get(`states/edit/${stateId}`);
      const fullState = res.data.data;

      setStateValue({ value: fullState.id, label });
      setStateObject(fullState);
      console.log(" fullState from API:", fullState);
      console.log(" polygon_geojson:", fullState.polygon_geojson);
    } catch (err) {
      handleError(err);
    }
  };
  useEffect(() => {
    if (governorateValue) {
      const statesForGov = states?.filter(
        (s) => s.governorate_id === governorateValue.value
      );
      setFilteredStates(statesForGov);
      setStateValue(null);
      setFilteredPlaces([]);
    }
  }, [governorateValue]);

  useEffect(() => {
    if (stateValue) {
      const placesForState = places?.filter(
        (p) => p.state_id === stateValue.value
      );
      setFilteredPlaces(placesForState);
      setPlaceValue([]);
    }
  }, [stateValue]);
  const fetchOwners = async () => {
    try {
      const res = await axiosMerchant.get("zones/owners"); // بدون type -> يرجع كل المجموعات
      const { groups = [] } = res.data;

      // نفكّ الجروبات ونضيف type على كل option
      const opts = groups.flatMap((g) =>
        (g.options || []).map((o) => ({
          value: o.id,
          label: `${g.label.slice(0, -1)} · ${o.name}`, // مثال: "Hub · Muscat Hub"
          type:
            GROUP_TO_TYPE[g.label] || g.label.toLowerCase().replace(/s$/, ""),
        }))
      );

      setOwnerOptions(opts);
    } catch (e) {
      handleError(e);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    if (ownerType) {
      setOwnerValue(null);
      fetchOwners(ownerType.value);
    } else {
      setOwnerOptions([]);
    }
  }, [ownerType]);
  const validateForm = () => {
    const newErrors = {
      name: formData.name ? "" : t("Zone name is required"),
      coordinates:
        polygonCoords.length >= 3
          ? ""
          : t("Zone area must have at least 3 points"),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const polygonPoints = polygonCoords.map((c) => [c.lng, c.lat]);
      const closedPolygon = [...polygonPoints, polygonPoints[0]];
      const coordinates = { type: "Polygon", coordinates: [closedPolygon] };

      const data = {
        name: formData.name,
        coordinates,
        multi_states: multiStates,
        place_ids: placeValue.map((p) => p.value),
      };
      if (ownerValue) {
        data.owner_id = Number(ownerValue.value);
        data.owner_type = ownerValue.type; // station|hub|branch
      }

      const response = await axiosMerchant.post(`zones/store`, data);
      toast.success(response.data.message);
      navigate("/routing-rules", {
        state: { from: "/zones/create-zone", name: "tab-/zones/create-zone" },
      });
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccess = can("Zone create");
  if (!canAccess) return navigate("/unauthorized");

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{t("Create new routing rules")}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <label htmlFor="name">{t("Name")}</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={multiStates}
                    onChange={(e) => setMultiStates(e.target.checked)}
                  />
                  حفظ كل الولايات المتقاطعة
                </label>
              </div>

              <div className="flex-1 min-w-[250px]">
                <label>{t("Governorate")}</label>
                <Select
                  value={governorateValue}
                  onChange={setGovernorateValue}
                  options={governorates?.map((g) => ({
                    value: g.id,
                    label: `${g.en_name} / ${g.ar_name}`,
                  }))}
                  placeholder={t("Select Governorate")}
                />
              </div>

              {governorateValue && (
                <div className="flex-1 min-w-[250px]">
                  <label>{t("State")}</label>
                  <Select
                    value={stateValue}
                    onChange={handleStateChange}
                    options={filteredStates?.map((s) => ({
                      value: s.id,
                      label: `${s.en_name} / ${s.ar_name}`,
                    }))}
                    placeholder={t("Select State")}
                  />
                </div>
              )}

              {stateValue && (
                <div className="flex-1 min-w-[100%]">
                  <label>{t("Places")}</label>
                  <Select
                    isMulti
                    value={placeValue}
                    onChange={setPlaceValue}
                    options={filteredPlaces?.map((p) => ({
                      value: p.id,
                      label: `${p.en_name} / ${p.ar_name ?? ""}`,
                    }))}
                    placeholder={t("Select one or more places")}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-[250px]">
              <label>{t("Owner")}</label>
              <Select
                value={ownerValue}
                onChange={setOwnerValue} // لازم يرجّع الـ option كله {value,label,type}
                options={ownerOptions}
                placeholder={t("Select owner")}
              />
            </div>

            <div className="mt-4">
              <ZoneMap
                stateValue={stateObject}
                polygonCoords={polygonCoords}
                setPolygonCoords={setPolygonCoords}
                zones={zones}
                states={states}
                height="500px"
                enableZones={true}
                enableStates={true}
                disableAutoFit={false}
              ></ZoneMap>
              {errors.coordinates && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.coordinates}
                </p>
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
    </div>
  );
}

export default ZoneCreate;
