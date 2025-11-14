import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  GoogleMap,
  Polygon,
  Marker,
  DrawingManager,
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import Select from "@/components/misc/Select";
import { useDispatch, useSelector } from "react-redux";
import {
  getGovernorates,
  getStates,
  getZones,
} from "@/stores/features/ajaxFeature";
import { Save, X, Undo, Loader2, Edit, Pencil } from "lucide-react";
import Loader from "@/components/Loader";
import { can, handleError, parsePolygon } from "@/utils/helpers";
import axiosMerchant from "@/axios";
import { wktToGeoJSON } from "@terraformer/wkt";
import { EditPolygon } from "./EditPolygon";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import ZonePolygon from "./ZonePolygon";

const Zones = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [governorateLoading, setGovernorateLoading] = useState(false);
  const [stateLoading, setStateLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [formData, setFormData] = useState({ name: "", coordinates: "" });
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const [polygonVersion, setPolygonVersion] = useState(0);

  // New state slices to distinguish creations vs edits
  const [createdZones, setCreatedZones] = useState([]);
  const [editedZones, setEditedZones] = useState({});
  const [originalZoneCoords, setOriginalZoneCoords] = useState(null);

  const [governorate, setGovernorate] = useState(null);
  const [state, setState] = useState(null);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);

  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const zones = useSelector((store) => store.ajax.zones);
  const dispatch = useDispatch();

  const mapRef = useRef(null);
  const [drawingManager, setDrawingManager] = useState(null);

  const polygonRef = useRef(null);
  const [govZones, setGovZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  useEffect(() => {
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!zones) dispatch(getZones());
  }, [dispatch, governorates, states, zones]);

  const { isLoaded } = useGoogleMaps();

  const animateToBounds = (map, bounds) => {
    const targetCenter = bounds.getCenter();
    const currentCenter = map.getCenter();
    const steps = 30;
    const duration = 1500;
    const interval = duration / steps;
    let stepCount = 0;
    const deltaLat = (targetCenter.lat() - currentCenter.lat()) / steps;
    const deltaLng = (targetCenter.lng() - currentCenter.lng()) / steps;
    const smoothPan = setInterval(() => {
      stepCount++;
      const lat = currentCenter.lat() + deltaLat * stepCount;
      const lng = currentCenter.lng() + deltaLng * stepCount;
      map.setCenter({ lat, lng });
      if (stepCount >= steps) {
        clearInterval(smoothPan);
        map.fitBounds(bounds, {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        });
      }
    }, interval);
  };
  // const handleGovernorateChange = async (gov) => {
  //   if (!gov) return;

  //   setGovernorateLoading(true);
  //   try {
  //     const response = await axiosMerchant.get(`governorates/edit/${gov.value}`);
  //     const polygons = parsePolygon(response.data.data.polygon_geojson);
  //     if (!polygons || polygons.length === 0) {
  //       toast(t("Invalid polygon data received"));
  //     }
  //     setFilteredZones(null);
  //     setState(null);
  //     setGovernorate({
  //       ...response.data.data,
  //       polygons,
  //       en_name: response.data.data.en_name || gov.data.en_name,
  //       ar_name: response.data.data.ar_name || gov.data.ar_name,
  //     });
  //     setFilteredStates(
  //       states.filter(
  //         (s) => s.governorate_id?.toString() === gov.value.toString()
  //       )
  //     );
  //     if (mapRef.current && polygons[0][0]) {
  //       const bounds = new window.google.maps.LatLngBounds();
  //       polygons[0][0].forEach((coord) => {
  //         bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
  //       });
  //       animateToBounds(mapRef.current, bounds); // بدلاً من mapRef.current.fitBounds(...)
  //     }
  //   } catch (error) {
  //     handleError(error);
  //     toast(t("Error loading governorate") + ": " + error.message);
  //   } finally {
  //     setGovernorateLoading(false);
  //   }
  // };

  const handleGovernorateChange = async (gov) => {
    if (!gov) return;

    setGovernorateLoading(true);
    try {
      const response = await axiosMerchant.get(`governorates/edit/${gov.value}`);
      const polygons = parsePolygon(response.data.data.polygon_geojson);
      if (!polygons || polygons.length === 0) {
        toast(t("Invalid polygon data received"));
      }

      -setFilteredZones(null);
      +setFilteredZones([]); // هنعيّنه بعد ما نجيب زونات المحافظة

      setState(null);
      setGovernorate({
        ...response.data.data,
        polygons,
        en_name: response.data.data.en_name || gov.data.en_name,
        ar_name: response.data.data.ar_name || gov.data.ar_name,
      });

      const statesForGov = states.filter(
        (s) => s.governorate_id?.toString() === gov.value.toString()
      );
      setFilteredStates(statesForGov);

      +(
        // NEW: هات كل زونات المحافظة من ولاياتها
        (+fetchZonesForGovernorate(statesForGov))
      );

      if (mapRef.current && polygons[0][0]) {
        const bounds = new window.google.maps.LatLngBounds();
        polygons[0][0].forEach((coord) => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
        animateToBounds(mapRef.current, bounds);
      }
    } catch (error) {
      handleError(error);
      toast(t("Error loading governorate") + ": " + error.message);
    } finally {
      setGovernorateLoading(false);
    }
  };

  const handleStateChange = async (st) => {
    if (!st) return;
    setStateLoading(true);
    try {
      const response = await axiosMerchant.get(`states/edit/${st.value}`);
      console.log(response.data.data, "response.data.data");
      const polygons = parsePolygon(response.data.data.polygon_geojson);
      if (!polygons || polygons.length === 0) {
        toast(t("Invalid polygon data received"));
      }
      setState({
        ...response.data.data,
        polygons,
        en_name: response.data.data.en_name || st.data.en_name,
        ar_name: response.data.data.ar_name || st.data.ar_name,
      });
      setFilteredZones(response.data.data.zones);
      if (
        mapRef.current &&
        Array.isArray(polygons) &&
        polygons.length > 0 &&
        Array.isArray(polygons[0]) &&
        polygons[0].length > 0
      ) {
        const bounds = new window.google.maps.LatLngBounds();
        polygons[0][0].forEach((coord) => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
        animateToBounds(mapRef.current, bounds);
      }
    } catch (error) {
      handleError(error);
      toast(t("Error loading state") + ": " + error.message);
    } finally {
      setStateLoading(false);
    }
  };
  const handleStateAfterCreate = async (st) => {
    if (!st?.id) return;
    setStateLoading(true);
    try {
      const response = await axiosMerchant.get(`states/edit/${st?.id}`);
      const polygons = parsePolygon(response.data.data.polygon_geojson);
      if (!polygons || polygons.length === 0) {
        toast(t("Invalid polygon data received"));
      }
      setState({
        ...response.data.data,
        polygons,
        en_name: response.data.data.en_name || st?.en_name,
        ar_name: response.data.data.ar_name || st?.ar_name,
      });
      setFilteredZones(response.data.data.zones);
      if (
        mapRef.current &&
        Array.isArray(polygons) &&
        polygons.length > 0 &&
        Array.isArray(polygons[0]) &&
        polygons[0].length > 0
      ) {
        const bounds = new window.google.maps.LatLngBounds();
        polygons[0][0].forEach((coord) => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
        animateToBounds(mapRef.current, bounds);
      }
    } catch (error) {
      handleError(error);
      toast(t("Error loading state") + ": " + error.message);
    } finally {
      setStateLoading(false);
    }
  };
  // NEW: تجمع زونات كل ولايات المحافظة الحالية
  const fetchZonesForGovernorate = async (statesArr) => {
    if (!Array.isArray(statesArr) || statesArr.length === 0) {
      setGovZones([]);
      setFilteredZones([]);
      return;
    }
    setZonesLoading(true);
    try {
      // نجيب zones لكل ولاية في نفس الوقت
      const reqs = statesArr.map((s) =>
        axiosMerchant.get(`states/edit/${s.id ?? s.value}`)
      );
      const results = await Promise.allSettled(reqs);

      const all = [];
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          const zs = r.value?.data?.data?.zones ?? [];
          all.push(...zs);
        }
      });

      // إزالة التكرار حسب id
      const unique = Array.from(new Map(all.map((z) => [z.id, z])).values());
      setGovZones(unique);
      setFilteredZones(unique);
    } catch (e) {
      handleError(e);
    } finally {
      setZonesLoading(false);
    }
  };

  const handleZoneChange = async () => {
    setLoading(true);
    try {
      // your existing logic (omitted)
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const onPolygonComplete = useCallback((polygon) => {
    const coords = polygon
      .getPath()
      .getArray()
      .map((p) => ({
        lat: p.lat(),
        lng: p.lng(),
      }));
    setDrawnPolygon(coords);
    setCreatedZones((prev) => [...prev, coords]);
    polygon.setMap(null);
  }, []);

  const handleCreateZone = () => {
    setMode("create");
    setSelectedZone(null);
    setFormData({ name: "", coordinates: "" });
    setDrawnPolygon(null);
  };

  const handleEditZone = (zone) => {
    setMode("edit");
    setSelectedZone(zone);
    setFormData({ name: zone.name });

    const firstPolygon = parsePolygon(zone.coordinates_geojson)[0]?.[0] || [];
    setOriginalZoneCoords(firstPolygon);
    setEditedZones({ [zone.id]: firstPolygon });
  };

  const handleUndo = () => {
    if (selectedZone && originalZoneCoords) {
      setEditedZones({ [selectedZone.id]: originalZoneCoords });
    }
  };

  const handleCancel = () => {
    setMode(null);
    setSelectedZone(null);
    setDrawnPolygon(null);
    setFormData({ name: "", coordinates: "" });
  };

  const handleSubmit = async () => {
    if (!formData.name) return;
    
    // Check permissions before submitting
    if (mode === "create" && !createAbility) {
      toast(t("You don't have permission to create zones"));
      return;
    }
    if (mode === "edit" && !updateAbility) {
      toast(t("You don't have permission to update zones"));
      return;
    }
    
    setLoading(true);

    try {
      if (mode === "create" && drawnPolygon) {
        const wkt = `POLYGON((${drawnPolygon
          .map((p) => `${p.lng} ${p.lat}`)
          .join(",")}))`;
        await axiosMerchant.post("/zones/store", {
          ...formData,
          coordinates: wktToGeoJSON(wkt),
          state_id: state.id,
        });
      } else if (mode === "edit") {
        let coords = editedZones[selectedZone.id] || [];
        if (coords.length < 3) {
          toast(t("Polygon must have at least 3 points"));
          setLoading(false);
          return;
        }
        const first = coords[0],
          last = coords[coords.length - 1];
        if (first.lat !== last.lat || first.lng !== last.lng) {
          toast(t("Polygon must be closed (first and last points match)"));
          setLoading(false);
          return;
        }
        const wkt = `POLYGON((${coords
          .map((p) => `${p.lng} ${p.lat}`)
          .join(",")}))`;
        await axiosMerchant.post("/zones/update", {
          ...formData,
          coordinates: wktToGeoJSON(wkt),
          zone_id: selectedZone.id,
          state_id: state.id,
        });
      }

      if (state?.id) await handleStateAfterCreate(state);
      handleCancel();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };
  const updatePath = useCallback(() => {
    const poly = polygonRef.current;
    if (!poly || mode !== "edit") return;
    const coords = poly
      .getPath()
      .getArray()
      .map((pt) => ({ lat: pt.lat(), lng: pt.lng() }));

    setEditedZones((prev) => ({
      ...prev,
      [selectedZone.id]: coords,
    }));
  }, [mode, selectedZone]);

  useEffect(() => {
    const poly = polygonRef.current;
    if (!poly || mode !== "edit") return;

    const path = poly.getPath();
    const listeners = [
      path.addListener("insert_at", updatePath),
      path.addListener("set_at", updatePath),
      path.addListener("remove_at", updatePath),
      poly.addListener("drag", updatePath),
      poly.addListener("dragend", updatePath),
    ];
    return () => listeners.forEach((l) => l.remove());
  }, [mode, updatePath]);

  const navigate = useNavigate();

  const canAccess = can("Zone access");
  const createAbility = can("Zone create");
  const updateAbility = can("Zone update");
  const deleteAbility = can("Zone delete");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  const renderControls = () => (
    <div className="space-y-4 h-[calc(100vh-170px)] overflow-y-auto">
      <Select
        id="governorate"
        value={
          governorate
            ? {
                value: governorate.id,
                label: `${governorate.en_name} - ${governorate.ar_name}`,
                polygon: governorate?.polygon_geojson,
                data: governorate,
              }
            : null
        }
        onChange={(gov) => handleGovernorateChange(gov)}
        options={governorates?.map((gov) => ({
          value: gov.id,
          label: `${gov.en_name} - ${gov.ar_name}`,
          polygon: gov?.polygon_geojson,
          data: gov,
        }))}
        placeholder={t("Select Governorate")}
        noOptionsMessage={() => t("No governorates available")}
        isDisabled={governorateLoading}
        isLoading={governorateLoading}
        className="w-full"
        styles={{
          control: (provided) => ({
            ...provided,
            backgroundColor: loading ? "#f3f4f6" : "white",
            borderColor: loading ? "#e5e7eb" : "currentColor",
          }),
          menu: (provided) => ({
            ...provided,
            width: "100%",
          }),
        }}
      />
      <Select
        id="state"
        value={
          state
            ? {
                value: state.id,
                label: `${state.en_name} - ${state.ar_name}`,
                polygon: state?.polygon_geojson,
                data: state,
              }
            : null
        }
        onChange={(st) => {
          if (!st) {
            // Clear state selection -> رجّع زونات المحافظة
            setState(null);
            setFilteredZones(govZones);
            return;
          }
          handleStateChange(st);
        }}
        options={filteredStates.map((st) => ({
          value: st.id,
          label: `${st.en_name} - ${st.ar_name}`,
          polygon: st?.polygon_geojson,
          data: st,
        }))}
        placeholder={t("Select State")}
        noOptionsMessage={() => t("No states available")}
        isDisabled={stateLoading}
        isLoading={stateLoading}
        isClearable
        className="w-full"
        styles={{
          control: (provided) => ({
            ...provided,
            backgroundColor: loading ? "#f3f4f6" : "white",
            borderColor: loading ? "#e5e7eb" : "currentColor",
          }),
          menu: (provided) => ({
            ...provided,
            width: "100%",
          }),
        }}
      />
      {mode ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-4 transition-colors duration-200">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t("Zone Name")}
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("Enter zone name")}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} variant="save" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
            </Button>
            <Button onClick={handleCancel} variant="close">
              <X size={16} />
            </Button>
            {mode === "edit" && (
              <Button onClick={handleUndo} variant="undo">
                <Undo size={16} />
              </Button>
            )}
          </div>
        </div>
      ) : (
        state && createAbility && (
          <Button onClick={handleCreateZone} className="mt-4">
            {t("Create New Zone")}
          </Button>
        )
      )}
      {filteredZones &&
        filteredZones.map((zone) => (
          <div
            key={zone.id}
            className="flex justify-between items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <span
              className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              onClick={() => handleZoneChange(zone)}
            >
              {zone.name}
            </span>
            {updateAbility && (
              <Button
                variant="edit"
                onClick={() => handleEditZone(zone)}
                tooltipLabel={t("Edit Zone")}
              >
                <Pencil size={16} />
              </Button>
            )}
          </div>
        ))}
    </div>
  );

  const renderDrawingManager = () => (
    <DrawingManager
      onLoad={(mgr) => setDrawingManager(mgr)}
      options={{
        drawingControl: mode === "create",
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes:
            mode === "create"
              ? [window.google.maps.drawing.OverlayType.POLYGON]
              : [],
        },
        polygonOptions: {
          fillColor: "#ffff00",
          fillOpacity: 0.2,
          strokeWeight: 3,
          clickable: false,
          editable: mode === "edit",
          draggable: mode === "edit",
        },
      }}
      onPolygonComplete={onPolygonComplete}
    />
  );

  if (!governorate && !states && !zones) {
    return <Loader />;
  }

  return isLoaded ? (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
      <div className="col-span-12 md:col-span-9">
        <div style={{ position: "relative", width: "100%", height: "500px" }}>
          {!governorateLoading ||
            (stateLoading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  backgroundColor: "rgba(255,255,255,0.7)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div className="loader" />
              </div>
            ))}
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "500px" }}
            center={{ lat: 23.588, lng: 58.3829 }}
            zoom={10}
            onLoad={(map) => (mapRef.current = map)}
          >
            {mode === "create" && renderDrawingManager()}

            {mode === "edit" &&
              selectedZone &&
              editedZones[selectedZone.id] && (
                <EditPolygon
                  zoneId={selectedZone.id}
                  paths={editedZones[selectedZone.id]}
                  onUpdate={(coords) =>
                    setEditedZones((prev) => ({
                      ...prev,
                      [selectedZone.id]: coords,
                    }))
                  }
                />
              )}
            {governorate?.polygons?.map((polygonGroup, groupIndex) => {
              return polygonGroup.map((paths, index) => {
                return (
                  <Polygon
                    key={`${groupIndex}-${index}`}
                    paths={paths}
                    options={{
                      fillColor: "#4f9c64",
                      fillOpacity: 0.35,
                      strokeColor: "#32a852",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      editable: false,
                      draggable: false,
                      clickable: false,
                    }}
                  />
                );
              });
            })}
            {state?.polygons?.map((paths, index) => {
              return (
                <Polygon
                  key={index}
                  paths={paths}
                  options={{
                    fillColor: "#FF0000",
                    fillOpacity: 0.35,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    editable: false,
                    draggable: false,
                    clickable: false,
                  }}
                />
              );
            })}
            {drawnPolygon && (
              <Polygon
                key={`${selectedZone?.id}-${polygonVersion}`}
                paths={drawnPolygon}
                options={{
                  fillColor: "#ffff00",
                  fillOpacity: 0.35,
                  strokeColor: "#ffd700",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  editable: mode === "edit",
                  draggable: mode === "edit",
                }}
                onLoad={(poly) => {
                  polygonRef.current = poly;
                  const path = poly.getPath();
                  const updateListener = () => {
                    const newCoords = path.getArray().map((p) => ({
                      lat: p.lat(),
                      lng: p.lng(),
                    }));
                    setDrawnPolygon(newCoords);
                    setEditedZones((prev) => ({
                      ...prev,
                      [selectedZone.id]: newCoords,
                    }));
                  };
                  path.addListener("insert_at", updateListener);
                  path.addListener("set_at", updateListener);
                  path.addListener("remove_at", updateListener);
                  poly.addListener("dragend", updateListener);
                }}
                onUnmount={() => {
                  polygonRef.current = null;
                }}
              />
            )}
            {filteredZones?.map((zone) => {
              if (mode === "edit" && zone.id === selectedZone?.id) return null;
              const coordinates =
                parsePolygon(zone.coordinates_geojson)[0]?.[0] || [];
              return (
                <ZonePolygon key={zone.id} zone={{ ...zone, coordinates }} />
              );
            })}
          </GoogleMap>
          {(governorateLoading || stateLoading) && (
            <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-400 dark:border-blue-500 border-opacity-50 dark:border-opacity-40"></div>
            </div>
          )}
          {zonesLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-400"></div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-12 md:col-span-3">{renderControls()}</div>
    </div>
  ) : (
    <div className="min-h-screen flex justify-center items-center">
      <Loader />
    </div>
  );
};

export default Zones;
