import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import Loader from "@/components/Loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { can, handleError } from "@/utils/helpers";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const DeliveryCommission = () => {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [driverData, setDriverData] = useState(null);
  const [formData, setFormData] = useState({});
  const params = useParams();

  const { t } = useTranslation();

  useEffect(() => {
    fetchDriverData();
    fetchCommissions();
  }, []);

  const fetchDriverData = async () => {
    try {
      const response = await axiosMerchant.get("drivers/getSingle", {
        params: { driver_id: params.driver_id },
      });

      const initialFormData = {};
      response.data.data.states.forEach((state) => {
        initialFormData[state.id] = 0;
      });

      setStates(response.data.data.states);
      setDriverData(response.data.data);
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("driver_commissions", {
        params: { driver_id: params.driver_id },
      });

      const initialFormData = {};
      response.data.data.forEach((commission) => {
        initialFormData[commission.state_id] = {
          delivery_fee: commission.delivery_fee,
          pickup_fee: commission.pickup_fee,
        };
      });

      setFormData(initialFormData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (stateId, value, type) => {
    setFormData((prev) => ({
      ...prev,
      [stateId]: {
        ...prev[stateId],
        [type]: value,
      },
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      driver_id: params.driver_id,
      commissions: Object.entries(formData).map(([state_id, fee]) => ({
        state_id,
        delivery_fee: fee.delivery_fee || 0,
        pickup_fee: fee.pickup_fee || 0,
      })),
    };

    console.log(payload);

    try {
      const response = await axiosMerchant.post("driver_commissions/store", payload);
      toast.success(response.data.message);
      fetchCommissions();
    } catch (error) {
      handleError(error);
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Delivery Commission access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  return (
    <div>
      <PageTitle
        title={`Driver Commissions ${driverData ? ` | ${driverData.name}` : ""
          }`}
      />

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 shadow-md py-4 mt-2 rounded-lg flex flex-col">
          <form onSubmit={handleSubmit}>
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="px-2 py-1">#</TableHead>
                  <TableHead className="px-2 py-1">{t("State")}</TableHead>
                  <TableHead className="px-2 py-1">{t("Delivery Fee")}</TableHead>
                  <TableHead className="px-2 py-1">{t("Pickup Fee")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-2">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : states.length > 0 ? (
                  states.map((state, index) => (
                    <TableRow key={state.id} className="text-xs">
                      <TableCell className="px-2 py-1">{index + 1}</TableCell>
                      <TableCell className="px-2 py-1">
                        {state.en_name}/{state.ar_name}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <Input
                          type="number"
                          className="w-24 h-8 text-xs px-1"
                          value={formData[state.id]?.delivery_fee || 0}
                          onChange={(e) => handleInputChange(state.id, e.target.value, "delivery_fee")}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <Input
                          type="number"
                          className="w-24 h-8 text-xs px-1"
                          value={formData[state.id]?.pickup_fee || 0}
                          onChange={(e) => handleInputChange(state.id, e.target.value, "pickup_fee")}
                        />
                      </TableCell>

                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-2">
                      No states found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Button type="submit">{t("Save")}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeliveryCommission;
