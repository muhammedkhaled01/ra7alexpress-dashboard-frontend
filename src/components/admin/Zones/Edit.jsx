import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Undo } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getPlaces, getZones } from "@/stores/features/ajaxFeature";
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
import { wktToGeoJSON } from "@terraformer/wkt";

function ZoneEdit() {
  const [isLoading, setIsLoading] = useState(true);
  const [zone, setZone] = useState(null);
  const [polygonCoords, setPolygonCoords] = useState([]);
  const [placeValue, setPlaceValue] = useState([]);
  const [originalCoords, setOriginalCoords] = useState([]);
  const [multiStates, setMultiStates] = useState(false);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [ownerValue, setOwnerValue] = useState(null);
  const GROUP_TO_TYPE = {
    Stations: "station",
    Hubs: "hub",
    Branches: "branch",
  };
  const fetchOwners = async () => {
    try {
      const res = await axiosMerchant.get("zones/owners");
      const { groups = [] } = res.data;
      const opts = groups.flatMap((g) =>
        (g.options || []).map((o) => ({
          value: o.id,
          label: `${g.label.slice(0, -1)} · ${o.name}`,
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
  const [errors, setErrors] = useState({
    name: "",
    coordinates: "",
  });

  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { places, placesLoading, zones } = useSelector((store) => store.ajax);
  // helper لفك اسم الكلاس القادم من الـ API -> station/hub/branch
  const classToType = (cls) =>
    cls ? cls.split("\\").pop().toLowerCase() : null;

  // لما الـ zone و الـ owners يجهزوا، اختار الـ owner الحالي
  useEffect(() => {
    if (!zone || ownerOptions.length === 0) return;

    const t = classToType(zone.owner_type); // ex: "station" | "hub" | "branch"
    const match = ownerOptions.find(
      (o) => o.value === zone.owner_id && o.type === t
    );
    if (match) {
      setOwnerValue(match);
    } else if (zone.owner_id && t) {
      // fallback بسيط لو الاسم مش موجود في القائمة لأي سبب
      setOwnerValue({
        value: zone.owner_id,
        label: `#${zone.owner_id}`,
        type: t,
      });
    }
  }, [zone, ownerOptions]);

  // Fetch places on mount if not available
  useEffect(() => {
    if (!zones) dispatch(getZones());
    if (!placesLoading && (!places || places.length === 0)) {
      dispatch(getPlaces());
    }
  }, [dispatch, places, placesLoading]);

  useEffect(() => {
    const fetchZone = async () => {
      try {
        const response = await axiosMerchant.post(`zones/edit/${params.id}`);
        const data = response.data.data;
        console.log("Zone data received:", data);
        setZone(data);

        const geo = data?.coordinates; // { type, coordinates }
        if (!geo || !geo.type || !geo.coordinates) {
          toast.error("Zone geometry is missing");
        } else {
          // خُد أول رينج فقط للرسم
          const ring =
            geo.type === "Polygon"
              ? geo.coordinates?.[0] || []
              : geo.type === "MultiPolygon"
              ? geo.coordinates?.[0]?.[0] || []
              : [];

          // في بعض الداتا بيكون آخر نقطة = أول نقطة (مضلع مُغلق)،
          // للماب مش محتاجين نكرر نقطة الإغلاق.
          const ringOpen =
            ring.length > 1 &&
            ring[0][0] === ring[ring.length - 1][0] &&
            ring[0][1] === ring[ring.length - 1][1]
              ? ring.slice(0, -1)
              : ring;

          const latLngRing = ringOpen.map(([lng, lat]) => ({ lat, lng }));
          setPolygonCoords(latLngRing);
          // خزّن الأصل كـ GeoJSON.coordinates بالكامل عشان المقارنة/الريست
          setOriginalCoords(geo.coordinates);
        }

        if (Array.isArray(data.places)) {
          setPlaceValue(
            data.places.map((place) => ({
              value: place.id,
              label: `${place.en_name} / ${place.ar_name ?? ""}`,
            }))
          );
        }
      } catch (error) {
        toast.error("Failed to load zone data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchZone();
  }, [params.id]);

  const validateForm = () => {
    const newErrors = {
      name: zone?.name ? "" : t("Zone name is required"),
      coordinates:
        polygonCoords.length >= 3
          ? ""
          : t("Zone area must have at least 3 points"),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === "");
  };

  useEffect(() => {
    console.log("Polygon coordinates updated:", polygonCoords);
  }, [polygonCoords]);

  useEffect(() => {
    if (!isLoading && zone && polygonCoords.length === 0) {
      console.log("No polygon coordinates found, initializing empty array");
      setPolygonCoords([]);
    }
  }, [isLoading, zone, polygonCoords.length]);

  const hasCoordinatesChanged = () => {
    const current = polygonCoords.map((c) => [c.lng, c.lat]);
    const originalFirstRing = originalCoords?.[0] || [];
    // شيل نقطة الإغلاق لو موجودة
    const originalOpen =
      originalFirstRing.length > 1 &&
      originalFirstRing[0][0] ===
        originalFirstRing[originalFirstRing.length - 1][0] &&
      originalFirstRing[0][1] ===
        originalFirstRing[originalFirstRing.length - 1][1]
        ? originalFirstRing.slice(0, -1)
        : originalFirstRing;
    return JSON.stringify(current) !== JSON.stringify(originalOpen);
  };

  const handleReset = () => {
    if (Array.isArray(originalCoords) && Array.isArray(originalCoords[0])) {
      const ring = originalCoords[0];
      const ringOpen =
        ring.length > 1 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
          ? ring.slice(0, -1)
          : ring;
      const latLngRing = ringOpen.map(([lng, lat]) => ({ lat, lng }));
      setPolygonCoords(latLngRing);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    if (polygonCoords.length < 3) {
      setIsLoading(false);
      return toast.error(t("Zone area must have at least 3 points"));
    }
    const ringOpen = polygonCoords.map((c) => [c.lng, c.lat]);
    const isClosed =
      ringOpen.length > 2 &&
      ringOpen[0][0] === ringOpen[ringOpen.length - 1][0] &&
      ringOpen[0][1] === ringOpen[ringOpen.length - 1][1];
    const closedPolygon = isClosed ? ringOpen : [...ringOpen, ringOpen[0]];

    const coordinates = {
      type: "Polygon",
      coordinates: [closedPolygon],
    };

    const data = {
      zone_id: zone.id,
      name: zone.name,
      // coordinates: coordinates,
      // multi_states: multiStates,

      place_ids: placeValue.map((p) => p.value),
    };
    // ابعت الـ coordinates فقط لو اتغيرت
    if (hasCoordinatesChanged()) {
      data.coordinates = coordinates;
    }
    // IMPORTANT: ابعت الـ owner لو متغير/موجود
    if (ownerValue && ownerValue.value && ownerValue.type) {
      data.owner_id = Number(ownerValue.value);
      data.owner_type = ownerValue.type;
    }

    try {
      const response = await axiosMerchant.post("zones/update", data);
      toast.success(response.data.message);
      navigate("/routing-rules", { state: { from: "/zones/edit-zone" } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!can("Zone update")) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{t("Update Zone")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="input-container flex-1 min-w-[250px]">
                <label htmlFor="name">{t("Name")}</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={zone?.name || ""}
                  onChange={(e) =>
                    setZone((prev) => ({ ...prev, name: e.target.value }))
                  }
                  error={errors.name}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div className=" input-container flex-1 min-w-[250px]">
                <label htmlFor="places">{t("Places")}</label>
                <Select
                  name="places"
                  isMulti
                  options={(places || []).map((place) => ({
                    value: place.id,
                    label: `${place.en_name} / ${place.ar_name ?? ""}`,
                  }))}
                  value={placeValue}
                  onChange={(selected) => setPlaceValue(selected || [])}
                  placeholder={t("Select one or more places")}
                  isDisabled={isLoading}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <label>{t("Owner")}</label>
                <Select
                  value={ownerValue}
                  onChange={setOwnerValue}
                  options={ownerOptions}
                  placeholder={t("Select owner")}
                  isClearable
                />
              </div>

              <div className="flex items-center gap-2 min-w-[250px] mt-6">
                <input
                  id="multi-states"
                  type="checkbox"
                  checked={multiStates}
                  onChange={(e) => setMultiStates(e.target.checked)}
                />
                <label htmlFor="multi-states">
                  {t("Save all intersecting states")}
                </label>
              </div>
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="h-500 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ZoneMap
                  height="500px"
                  polygonCoords={polygonCoords}
                  setPolygonCoords={setPolygonCoords}
                  zones={zones}
                  enableZones={false}
                  isEditMode={true}
                />
              )}
              {errors.coordinates && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.coordinates}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("Save Changes")
                )}
              </Button>
              {originalCoords.length > 0 && hasCoordinatesChanged() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  <Undo className="h-4 w-4 mr-2" />
                  {t("Reset")}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default ZoneEdit;
