import React, { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
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

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    first_owner_name: "",
    first_owner_phone: "",
    second_owner_name: "",
    second_owner_phone: "",
    third_owner_name: "",
    third_owner_phone: "",
    license_no: "",
    license_issue_date: "",
    license_expiry_date: "",
    phone: "",
    address: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    console.log(file);
    setFormData((prevState) => ({
      ...prevState,
      logo: file || null,
    }));
  };

  const handleLicenseChange = (event) => {
    const file = event.target.files[0];
    console.log(file)
    setFormData((prevState) => ({
      ...prevState,
      license: file || null,
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    console.log(value);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      e.preventDefault()
      const form = new FormData(e.currentTarget)
      const response = await axiosMerchant.post("api/admin/companies/store", form);

      toast.success(response.data.message);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
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
      setShowDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button>Add New Company</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Add New Company </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                name="name"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="password">Password</label>
              <Input
                id="password"
                name="password"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="first_owner_name">First Owner Name</label>
              <Input
                id="first_owner_name"
                name="first_owner_name"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="first_owner_phone">First Owner Phone</label>
              <Input
                id="first_owner_phone"
                name="first_owner_phone"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="second_owner_name">Second Owner Name</label>
              <Input
                id="second_owner_name"
                name="second_owner_name"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="second_owner_phone">Second Owner Phone</label>
              <Input
                id="second_owner_phone"
                name="second_owner_phone"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="third_owner_name">Third Owner Name</label>
              <Input
                id="third_owner_name"
                name="third_owner_name"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="third_owner_phone">Third Owner Phone</label>
              <Input
                id="third_owner_phone"
                name="third_owner_phone"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="license_no">License No</label>
              <Input
                id="license_no"
                name="license_no"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="license_issue_date">License Issue Date</label>
              <Input
                id="license_issue_date"
                name="license_issue_date"
                type="date"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="license_expiry_date">License Expiry Date</label>
              <Input
                id="license_expiry_date"
                name="license_expiry_date"
                type="date"
                onChange={handleInputChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="phone">Phone</label>
              <Input
                id="phone"
                name="phone"
                type="text"
                onChange={handleInputChange}
              />
            </div>

            <div className="input-container">
              <label htmlFor="Logo">Logo</label>
              <Input name="logo" type="file" />
            </div>

            <div className="input-container">
              <label htmlFor="License">License</label>
              <Input
                name="license"
                type="file"
                onChange={handleLicenseChange}
              />
            </div>
            <div className="input-container">
              <label htmlFor="address">Address</label>
              <Textarea
                name="address"
                placeholder="Address"
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

export default Create;