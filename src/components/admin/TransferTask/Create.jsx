import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Plus, Trash2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can, handleError, generateTabId } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { useDispatch, useSelector } from "react-redux";
import { getTruckDrivers, getTrucks } from "@/stores/features/ajaxFeature";
import { closeTab } from "@/stores/features/tabsFeature";

function TransferTaskCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [destinationRows, setDestinationRows] = useState([{ id: Date.now(), selectedDestination: null },]);
  const [transferAreas, setTransferAreas] = useState([]);
  const [truckDriver, setTruckDriver] = useState(null);
  const [truck, setTruck] = useState(null);
  const [errors, setErrors] = useState({
    truck_id: '',
    truck_driver_id: ''
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const trucks = useSelector(store => store.ajax.trucks)
  const truck_drivers = useSelector(store => store.ajax.truck_drivers)

  useEffect(() => {
    if (!trucks) dispatch(getTrucks())
    if (!truck_drivers) dispatch(getTruckDrivers())
    axiosMerchant.get("transfer_areas").then((response) => {
      setTransferAreas(response.data.data);
    });
  }, []);

  const validateForm = () => {
    const newErrors = {
      truck_id: truck ? '' : t('Truck is required'),
      truck_driver_id: truckDriver ? '' : t('Truck Driver is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const destinations = destinationRows
        .filter((row) => row.selectedDestination)
        .map((row) => ({
          owner_id: row.selectedDestination.value.owner_id,
          owner_type: row.selectedDestination.value.owner_type,
        }));

      formData.delete("destination[]");
      formData.set("destinations", JSON.stringify(destinations));

      const response = await axiosMerchant.post("transfer_tasks/store", formData);
      toast.success(response.data.message);
      // Navigate to transfer tasks list and pass tab ID to close
      const currentTabId = generateTabId("/shipments/create-transfer-task");
      navigate("/shipments/transfer-tasks", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDestination = () => {
    setDestinationRows((prev) => [
      ...prev,
      { id: Date.now(), selectedDestination: null },
    ]);
  };

  const handleRemoveDestination = (rowId) => {
    setDestinationRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleDestinationChange = (rowId, selectedOption) => {
    setDestinationRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, selectedDestination: selectedOption } : row
      )
    );
  };

  const totalShipmentsCount = destinationRows.reduce((sum, row) => {
    if (row.selectedDestination) {
      const { owner_id, owner_type } = row.selectedDestination.value;
      const found = transferAreas.find(
        (area) =>
          area.owner_id === owner_id && area.owner_type === owner_type
      );
      return sum + (found?.shipments_count || 0);
    }
    return sum;
  }, 0);

  const canAccess = can("Transfer Task create")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  console.log(truck_drivers, 'truck_drivers')
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{t("Create new Transfer Task")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("Truck and Driver")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                    <div className="mt-2">
                      <label htmlFor="truck_id">{t("Truck")} <RequiredField /></label>
                      <Select
                        name="truck_id"
                        options={trucks?.map((truck) => ({ value: truck.id, label: `${truck.number_plate} - ${truck.company}`, }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        value={truck ? { value: truck.id, label: `${truck.number_plate} - ${truck.company}` } : null}
                        placeholder={t("Select Truck...")}
                        onChange={(e) => {
                          const selected_truck = trucks.find((truck) => truck.id === e.value);
                          setTruck(selected_truck);
                        }}
                        error={errors.truck_id}
                      />
                      {errors.truck_id && (
                        <p className="mt-1 text-sm text-red-500">{errors.truck_id}</p>
                      )}
                    </div>
                    <div className="mt-2">
                      <label htmlFor="truck_driver_id">{t("Truck Driver")} <RequiredField /></label>
                      <Select
                        name="truck_driver_id"
                        options={truck_drivers?.map((truck_driver) => ({ value: truck_driver?.id, label: truck_driver?.user?.name, }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        value={truckDriver ? { value: truckDriver?.id, label: truckDriver?.user?.name } : null}
                        placeholder={t("Select Truck Driver...")}
                        onChange={(e) => {
                          const selectedDriver = truck_drivers.find((driver) => driver.id === e.value);
                          setTruckDriver(selectedDriver);
                        }}
                        error={errors.truck_driver_id}
                      />
                      {errors.truck_driver_id && (
                        <p className="mt-1 text-sm text-red-500">{errors.truck_driver_id}</p>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex justify-between">
                          <strong>{t("Number Plate")}</strong>
                          <span>{truck?.number_plate}</span>
                        </div>
                        <div className="flex justify-between">
                          <strong>{t("Company")}</strong>
                          <span>{truck?.company || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <strong>{t("Color")}</strong>
                          <span>{truck?.color || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <strong>{t("Notes")}</strong>
                          <span>{truck?.notes || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex justify-between">
                          <strong>{t("Name")}</strong>
                          <span>{truckDriver?.user?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <strong>{t("Phone Number")}</strong>
                          <span>
                            {String(truckDriver?.country_code ?? "") + String(truckDriver?.phone_number ?? "")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <strong>{t("ID Card Number")}</strong>
                          <span>{truckDriver?.id_card_number || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <strong>{t("Company")}</strong>
                          <span>{truckDriver?.company || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* <div className="mt-2">
                    <label htmlFor="name">{t("Name")}:</label>
                    <Input id="name" name="name" type="text" />
                  </div>
                  <div className="mt-2">
                    <label htmlFor="id_card_number">{t("ID Card Number")}:</label>
                    <Input id="id_card_number" name="id_card_number" type="text" />
                  </div>
                  <div className="mt-2">
                    <label htmlFor="phone_number">{t("Phone Number")}:</label>
                    <Input id="phone_number" name="phone_number" type="text" />
                  </div>
                  <div className="mt-2">
                    <label htmlFor="company">{t("Company")}:</label>
                    <Input id="company" name="company" type="text" />
                  </div> */}
                </CardContent>
              </Card>
              <Card className="">
                <CardHeader>
                  <div className="flex flex-row justify-between items-center">
                    <CardTitle className="self-center">
                      {t("Destinations")} ({totalShipmentsCount} {t("shipments")})
                    </CardTitle>
                    <Button type="button" onClick={handleAddDestination}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {destinationRows.map((row) => {
                    const usedOwnerIds = destinationRows
                      .filter((r) => r.id !== row.id && r.selectedDestination)
                      .map((r) => r.selectedDestination.value.owner_id);

                    const availableOptions = transferAreas
                      .filter((area) => !usedOwnerIds.includes(area.owner_id))
                      .map((area) => ({
                        label: area.owner,
                        value: {
                          owner_id: area.owner_id,
                          owner_type: area.owner_type,
                        },
                      }));

                    return (
                      <div
                        key={row.id}
                        className="grid sm:grid-cols-1 lg:grid-cols-11 gap-4 mt-2"
                      >
                        <div className="col-span-10">
                          <label htmlFor={`destination-${row.id}`}>
                            {t("Destination")}
                          </label>
                          <Select
                            name="destination[]"
                            placeholder={t("Select Destination...")}
                            value={availableOptions.find(
                              (opt) =>
                                opt.value.owner_id ===
                                row.selectedDestination?.value.owner_id &&
                                opt.value.owner_type ===
                                row.selectedDestination?.value.owner_type
                            )}
                            onChange={(option) =>
                              handleDestinationChange(row.id, option)
                            }
                            options={availableOptions}
                          />
                        </div>
                        <div className="col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleRemoveDestination(row.id)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">

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
    </div >
  );
}

export default TransferTaskCreate;
