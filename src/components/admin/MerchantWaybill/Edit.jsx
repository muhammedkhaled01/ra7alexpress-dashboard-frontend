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
import { useDispatch, useSelector } from "react-redux";
import { getMerchants, getCountries } from "@/stores/features/ajaxFeature";
import Select from "@/components/misc/Select";

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const merchants = useSelector((store) => store.ajax.merchants);

  useEffect(() => {
    if (!merchants) dispatch(getMerchants())
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await axiosMerchant.post("merchants/update", formData);
      toast.success(response.data.message);
      await dispatch(getMerchants());
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
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
          <DialogTitle>{t("Update Merchant")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="merchant_id">{t("Merchant")}</label>
              <Select
                name="merchant_id"
                options={merchants?.map((merchant) => ({
                  value: merchant.id,
                  label: merchant.name,
                }))}

                className="basic-multi-select"
                classNamePrefix="select"
              />
            </div>
            <div className="input-container">
              <label htmlFor="quantity">{t("Quantity")}</label>
              <Input
                name="quantity"
                type="number"
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

export default Edit;
