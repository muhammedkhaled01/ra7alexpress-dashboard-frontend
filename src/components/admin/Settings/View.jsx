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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { baseURL } from "../../../../config";

function View({ record, onClose }) {
  const create_at = new Date(record.created_at);
  const createdDate = create_at.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

    const isImage = (url) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  };
  const LicenseLink = ({ url }) => {
    if (isImage(url)) {
      return (
        <div>
          <img className="h-[150px] w-[150px] rounded" src={baseURL + '/' + url} alt="License" />
          <a
            href={baseURL + '/' + url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-primary hover:underline"
          >
            View
          </a>
        </div>
      );
    } else {
      return (
        <a
          href={baseURL + '/' + url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          License
        </a>
      );
    }
  };
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader id="no-print">
          <DialogTitle>Company :: {record.name}</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="flex justify-between">
          <div>
            Logo
            <img
              className="h-[150px] w-[150px] rounded"
              src={baseURL + "/" + record.company.image}
              alt=""
            />{" "}
            <a href={baseURL + "/" + record.company.image}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-primary hover:underline">
              View
            </a>
          </div>

          <div>
            License
            <LicenseLink url={record.company.license} />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-4">
          <div>
            <ul className="grid gap-3">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>{record.name}</span>
              </li>

              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{record.company.phone}</span>
              </li>

              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{record.email}</span>
              </li>

              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">License#</span>
                <span>{record.company.license_no}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  License Issue Date
                </span>
                <span>{record.company.license_issue_date}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">License Expiry</span>
                <span className="text-red-500">
                  {record.company.license_expiry_date}
                </span>
              </li>

              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Created At</span>
                <span>{createdDate}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Address</span>
                <span>{record.company.address}</span>
              </li>
            </ul>
          </div>
        </div>
        <Separator />
        <div className="flex justify-center gap-1">
          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle>First Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{record.company.first_owner_name}</span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{record.company.first_owner_phone}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle>Second Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{record.company.second_owner_name}</span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{record.company.second_owner_phone}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle>Third Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{record.company.third_owner_name}</span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{record.company.third_owner_phone}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
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
