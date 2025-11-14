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
import { useDispatch, useSelector } from "react-redux";
import { can, formatDecimalValue, handleError, isAuthorized } from "@/utils/helpers";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Loader2, Zap } from "lucide-react";

const ShipperCommission = () => {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [shipperData, setShipperData] = useState(null);
  const [formData, setFormData] = useState({});
  const [defaultCommission, setDefaultCommission] = useState(0);
  const params = useParams();
  const dispatch = useDispatch();
  const { decimalPrecision } = useSelector((state) => state.setting);

  const { t } = useTranslation();


  // دالة للتحقق من صحة القيمة المدخلة (تسمح فقط بالأرقام والنقطة)
  const validateDecimalInput = (value) => {
    // السماح فقط بالأرقام والنقطة مع الحد الأقصى للأرقام العشرية
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimalPrecision || 3}}$`);
    return regex.test(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchShipperData();
      await fetchCommissions();
    };
    fetchData();
  }, []);

  // إعادة تحميل البيانات عند تغيير decimalPrecision
  useEffect(() => {
    if (states.length > 0) {
      // إعادة تنسيق القيم الحالية بناءً على decimalPrecision الجديدة
      const updatedFormData = {};
      Object.entries(formData).forEach(([stateId, fees]) => {
        updatedFormData[stateId] = {
          delivery_fee: formatDecimalValue(fees.delivery_fee, decimalPrecision),
        };
      });
      setFormData(updatedFormData);

      // إعادة تنسيق القيمة الافتراضية
      setDefaultCommission(formatDecimalValue(defaultCommission, decimalPrecision));
    }
  }, [decimalPrecision]);

  const fetchShipperData = async () => {
    try {
      const response = await axiosMerchant.get("shippers/getSingle", {
        params: { shipper_id: params.id },
      });

      const initialFormData = {};
      response.data.data.states.forEach((state) => {
        initialFormData[state.id] = {
          delivery_fee: formatDecimalValue(0, decimalPrecision),
        };
      });

      setStates(response.data.data.states);
      setShipperData(response.data.data);
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error fetching shipper data:", error);
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("shipper_commissions", {
        params: { shipper_id: params.id },
      });

      setCommissions(response.data.data);

      const initialFormData = {};
      response.data.data.forEach((commission) => {
        initialFormData[commission.state_id] = {
          delivery_fee: formatDecimalValue(commission.delivery_fee, decimalPrecision),
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
    // التحقق من صحة الإدخال
    if (!validateDecimalInput(value)) {
      return; // لا تقبل القيمة إذا كانت غير صالحة
    }

    // تقسيم القيمة إلى أجزاء قبل وبعد الفاصلة
    const parts = value.split('.');

    // إذا كان هناك جزء بعد الفاصلة وأكثر من decimalPrecision أرقام، اقتطاع إلى decimalPrecision أرقام
    if (parts.length === 2 && parts[1].length > (decimalPrecision || 3)) {
      value = `${parts[0]}.${parts[1].substring(0, decimalPrecision || 3)}`;
    }

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
    setLoading(true)
    const commissionsToSend = Object.entries(formData)
      .filter(([state_id]) => !isNaN(parseInt(state_id, 10)))
      .map(([state_id, fee]) => ({
        state_id: parseInt(state_id, 10),
        delivery_fee: parseFloat(fee.delivery_fee) || 0,
      }));
    const payload = {
      shipper_id: params.id,
      commissions: commissionsToSend,
    };

    console.log(payload);

    try {
      const response = await axiosMerchant.post("shipper_commissions/store", payload);
      toast.success(response.data.message);
      fetchCommissions();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false)
    }
  };

  const handleDefaultCommission = async () => {
    const formattedCommission = formatDecimalValue(defaultCommission, decimalPrecision);
    const numCommission = parseFloat(formattedCommission);

    if (isNaN(numCommission) || numCommission < 0) {
      toast.error(t("Please enter a valid default commission value"));
      return;
    }

    setFormData((prev) => {
      const newFormData = { ...prev };
      // Apply to all states, not just existing ones
      states.forEach(state => {
        newFormData[state.id] = {
          delivery_fee: formattedCommission,
        };
      });
      return newFormData;
    });
  }

  const navigate = useNavigate()

  const canAccess = can("Shipper Commission access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <div className="flex flex-row justify-between">
        <PageTitle
          title={`Shipper Commissions`}
        />
        <div className="flex gap-x-2 items-center">
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("Save")
                )}
              </Button>
          <Input
            name="defaultCommission"
            type="text" 
            className="w-[200px]"
            placeholder={t("Default Commission")}
            value={defaultCommission}
            onChange={(e) => {
              const value = e.target.value;
              if (validateDecimalInput(value)) {
                setDefaultCommission(value);
              }
            }}
            onBlur={(e) => {
              // عند فقدان التركيز، تنسيق القيمة
              setDefaultCommission(formatDecimalValue(e.target.value, decimalPrecision));
            }}
          />
          <Button
            type="button"
            variant="refresh"
            onClick={handleDefaultCommission}
            title={t("Apply to All States")}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {t("Apply to All")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 shadow-md py-4 mt-2 rounded-lg flex flex-col">
          <form onSubmit={handleSubmit}>
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="px-2 py-1">#</TableHead>
                  <TableHead className="px-2 py-1">State</TableHead>
                  <TableHead className="px-2 py-1">Delivery Fee</TableHead>
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
                          type="text" // تغيير إلى text للتحكم في التنسيق
                          className="w-24 h-8 text-xs px-1"
                          value={formData[state.id]?.delivery_fee || formatDecimalValue(0, decimalPrecision)}
                          onChange={(e) => handleInputChange(state.id, e.target.value, "delivery_fee")}
                          onBlur={(e) => {
                            // عند فقدان التركيز، تنسيق القيمة
                            handleInputChange(state.id, formatDecimalValue(e.target.value, decimalPrecision), "delivery_fee");
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-2">
                      No states found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("Save")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShipperCommission;