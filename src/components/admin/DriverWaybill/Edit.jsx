import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { handleError } from "@/utils/helpers";
import Select from "@/components/misc/Select";

function DriverWaybillEdit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    axiosMerchant
      .get("/users?role=Driver")
      .then((res) => {
        setDrivers(res.data?.data || []);
      })
      .catch(handleError);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const res = await axiosMerchant.post("driver_waybills/update", formData);
      toast.success(res.data.message);
      onSubmitSuccess?.();
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Update Driver Waybill")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="driver_id">{t("Driver")}</label>
              <Select
                name="driver_id"
                options={drivers?.map((d) => ({ value: d.id, label: d.name }))}
                className="basic-multi-select"
                classNamePrefix="select"
                defaultValue={
                  record?.driver
                    ? { value: record.driver.id, label: record.driver.name }
                    : null
                }
              />
            </div>
            <div className="input-container">
              <label htmlFor="used">{t("Used (0/1)")}</label>
              <Input
                name="used"
                type="number"
                min="0"
                max="1"
                defaultValue={Number(!!record?.used)}
              />
            </div>
          </div>
          <input type="hidden" name="id" value={record.id} />
          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="mr-2">
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
export default DriverWaybillEdit;
