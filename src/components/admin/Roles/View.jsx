import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";

function View({ record, onClose }) {
  const { t } = useTranslation();

  const createdDate = new Date(record.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const updatedDate = new Date(record.updated_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("Role Details")}</SheetTitle>
          <SheetDescription>{record.name}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Basic Information")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex justify-between">
                  <strong>{t("Role Name")}</strong>
                  <span>{record.name}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Guard")}</strong>
                  <span>{record.guard_name}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Created")}</strong>
                  <span>{createdDate}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Updated At")}</strong>
                  <span>{updatedDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Permissions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {record.permissions?.map((permission) => (
                  <Badge key={permission.id} variant="secondary">
                    {permission.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default View;
