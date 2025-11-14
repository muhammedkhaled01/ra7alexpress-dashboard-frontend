import { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosMerchant from "@/axios";
import { default as Select } from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMerchants, getDrivers } from "@/stores/features/ajaxFeature";
import { driverName, handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Edit({ onSubmitSuccess, record, onClose }) {
  Edit.propTypes = {
    onSubmitSuccess: PropTypes.func.isRequired,
    record: PropTypes.shape({
      id: PropTypes.number.isRequired,
      merchant: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string
      }),
      driver: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string
      }),
      no_of_shipments: PropTypes.string,
      note: PropTypes.string
    }).isRequired,
    onClose: PropTypes.func.isRequired
  };

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const merchants = useSelector((store) => store.ajax.merchants);
  const drivers = useSelector((store) => store.ajax.drivers);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    driver_id: '',
    merchant_id: '',
    no_of_shipments: '',
    note: ''
  });
  const [errors, setErrors] = useState({
    driver_id: '',
    merchant_id: '',
    no_of_shipments: ''
  });

  useEffect(() => {
    if (!merchants) dispatch(getMerchants());
    if (!drivers) dispatch(getDrivers());
  }, [dispatch, merchants, drivers]);

  useEffect(() => {
    if (record) {
      setFormData({
        driver_id: record.driver?.id || '',
        merchant_id: record.merchant?.id || '',
        no_of_shipments: record.no_of_shipments || '',
        note: record.note || ''
      });
    }
  }, [record]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('id', record.id);

      const response = await axiosMerchant.post("pickup_tasks/update", formDataToSend);
      if (response.data.success) {
        toast.success(t("Task updated successfully"));
        onSubmitSuccess();
        onClose();
      } else {
        toast.error(t("Failed to update task"));
      }
    } catch (error) {
      handleError(error, t);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.driver_id) {
      errors.driver_id = t("Driver is required");
    }
    if (!data.merchant_id) {
      errors.merchant_id = t("Merchant is required");
    }
    if (!data.no_of_shipments) {
      errors.no_of_shipments = t("Number of shipments is required");
    }
    return errors;
  };

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Edit Pickup Task")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("Merchant")} <RequiredField /></label>
            <Select
              options={merchants?.map(merchant => ({
                value: merchant.id,
                label: merchant.name
              })) || []}
              value={{ value: formData.merchant_id, label: merchants?.find(merchant => merchant.id === formData.merchant_id)?.name || '' }}
              onChange={(selected) => {
                setFormData(prev => ({ ...prev, merchant_id: selected?.value }));
              }}
              className="w-full"
            />
            {errors.merchant_id && (
              <p className="text-red-500 text-sm mt-1">{errors.merchant_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("Driver")} <RequiredField /></label>
            <Select
              options={drivers?.map(driver => ({
                value: driver.id,
                label: driverName(driver)
              })) || []}
              value={{ value: formData.driver_id, label: drivers?.find(driver => driver.id === formData.driver_id)?.name || '' }}
              onChange={(selected) => {
                setFormData(prev => ({ ...prev, driver_id: selected?.value }));
              }}
              className="w-full"
            />
            {errors.driver_id && (
              <p className="text-red-500 text-sm mt-1">{errors.driver_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("Number of Shipments")} <RequiredField /></label>
            <Input
              type="number"
              name="no_of_shipments"
              value={formData.no_of_shipments}
              onChange={handleChange}
              className="w-full"
              error={errors.no_of_shipments}
            />
            {errors.no_of_shipments && (
              <p className="text-red-500 text-sm mt-1">{errors.no_of_shipments}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("Note")}</label>
            <Textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Updating")}
                </>
              ) : (
                t("Update")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Edit;