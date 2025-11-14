import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import ImagePreview from "@/components/misc/ImagePreview";
import { useTranslation } from "react-i18next";

function View({ record, onClose }) {
  const { t } = useTranslation()
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader id="no-print">
          <DialogTitle>User</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="grid grid-cols-1 gap-4">
          <div>
            <ul className="grid gap-3">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("Name")}</span>
                <span>{record?.name}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("Email")}</span>
                <span>{record?.email}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("Role")}</span>
                <span>{record?.roles[0]?.name}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("Phone")}</span>
                <span> {String(record?.country_code ?? "") + String(record?.phone ?? "")}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("Created At")}</span>
                <span>{new Date(record?.created_at).toLocaleString()}</span>
              </li>
              <Separator /><h2><strong>{t("Relatives")}</strong></h2>
              {record?.driver_relatives && record?.driver_relatives.length > 0 && record?.driver_relatives.map((relative) => (
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">{relative?.name}</span>
                  <span>{relative?.phone} | {relative?.relation}</span>
                </li>
              ))}
              {record?.driver?.license &&
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("License")}</span>
                  <span>
                    <ImagePreview src={record?.driver?.license} />
                  </span>
                </li>}
              {record?.driver?.id_card &&
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("ID Card")}</span>
                  <span>
                    <ImagePreview src={record?.driver?.id_card} />
                  </span>
                </li>}
              {record?.driver?.car_ownership_id &&
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Car Ownership ID")}</span>
                  <span>
                    <ImagePreview src={record?.driver?.car_ownership_id} />
                  </span>
                </li>}
              <Separator /><h2><strong>{t("Other Documents")}</strong></h2>
              {record?.driver_files && record?.driver_files.length > 0 && record?.driver_files.map((file) => (
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">{file?.name}</span>
                  <span>
                    <ImagePreview src={file.file} />
                  </span>
                </li>
              ))}
              {/* <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Image</span>
                <span><Link target="_blank" to={import.meta.env.VITE_FILE_URL + '/' + record?.image}><img width={"200px"} src={import.meta.env.VITE_FILE_URL + '/' + record?.image} alt="" /></Link></span>
              </li> */}
            </ul>
          </div>
        </div>
        <Separator />
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default View;
