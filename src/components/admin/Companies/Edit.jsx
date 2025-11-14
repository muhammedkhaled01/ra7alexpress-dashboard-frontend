import React, { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import axiosMerchant from "@/axios";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { baseURL } from "../../../../config";

function Edit({ onSubmitSuccess, record, onClose }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: record.name,
    id: record.id,
    email: record.email,
    first_owner_name: record.company.first_owner_name,
    first_owner_phone: record.company.first_owner_phone,
    second_owner_name: record.company.second_owner_name,
    second_owner_phone: record.company.second_owner_phone,
    third_owner_name: record.company.third_owner_name,
    third_owner_phone: record.company.third_owner_phone,
    license_no: record.company.license_no,
    license_issue_date: record.company.license_issue_date,
    license_expiry_date: record.company.license_expiry_date,
    phone: record.company.phone,
    address: record.company.address,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleLogoChange = (event) => {
    const file = event.target.files[0];

    setFormData((prevState) => ({
      ...prevState,
      logo: file || null,
    }));
  };

  const handleLicenseChange = (event) => {
    const file = event.target.files[0];

    setFormData((prevState) => ({
      ...prevState,
      license: file || null,
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await axiosMerchant.post(
        "api/admin/companies/update",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success(response.data.message);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach((errorMessage) => {
          toast.error(errorMessage);
        });
      } else {
        toast.error("An error occurred while submitting the form.");
      }
      console.error("Failed to submit data:", error);
      // No need to set setShowDialog(true) here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader id="no-print">
          <DialogTitle>Update Company :: {formData.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-container">
              <label htmlFor="first_owner_name">First Owner Name</label>
              <Input
                id="first_owner_name"
                name="first_owner_name"
                type="text"
                value={formData.first_owner_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="first_owner_phone">First Owner Phone</label>
              <Input
                id="first_owner_phone"
                name="first_owner_phone"
                type="text"
                value={formData.first_owner_phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="second_owner_name">Second Owner Name</label>
              <Input
                id="second_owner_name"
                name="second_owner_name"
                type="text"
                value={formData.second_owner_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="second_owner_phone">Second Owner Phone</label>
              <Input
                id="second_owner_phone"
                name="second_owner_phone"
                type="text"
                value={formData.second_owner_phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="third_owner_name">Third Owner Name</label>
              <Input
                id="third_owner_name"
                name="third_owner_name"
                type="text"
                value={formData.third_owner_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="third_owner_phone">Third Owner Phone</label>
              <Input
                id="third_owner_phone"
                name="third_owner_phone"
                type="text"
                value={formData.third_owner_phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="license_no">License No</label>
              <Input
                id="license_no"
                name="license_no"
                type="text"
                value={formData.license_no}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="license_issue_date">License Issue Date</label>
              <Input
                id="license_issue_date"
                name="license_issue_date"
                type="date"
                value={formData.license_issue_date}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="license_expiry_date">License Expiry Date</label>
              <Input
                id="license_expiry_date"
                name="license_expiry_date"
                type="date"
                value={formData.license_expiry_date}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="phone">Phone</label>
              <Input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-container">
              <label htmlFor="Logo">Logo</label>
              <Input name="logo" type="file" onChange={handleLogoChange} />

              <img
                className="h-[80px] w-[80px] rounded mt-1"
                src={baseURL + "/" + record.company.image}
                alt=""
              />
            </div>

            <div className="input-container">
              <label htmlFor="License">License</label>
              <Input
                name="license"
                type="file"
                onChange={handleLicenseChange}
              />
              <a
                href={baseURL + "/" + record.company.license}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                License
              </a>
            </div>
            <div className="input-container">
              <label htmlFor="address">Address</label>
              <Textarea
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Edit;
