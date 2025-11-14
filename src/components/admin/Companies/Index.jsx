import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EyeIcon, MoreHorizontal, Pencil, Trash2Icon } from "lucide-react";
import { Input } from "../../ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-toastify";
import { Skeleton } from "../../ui/skeleton";
import View from "./View";
import Create from "./Create";
import Edit from "./Edit";
import Pagination from "@/components/Pagination";

const Companies = () => {
  const [companyData, setCompanyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const openViewDialog = (record) => {
    setselectedRecord(record);
    setViewDialogOpen(true);
  };

  const openEditDialog = (record) => {
    setselectedRecord(record);
    console.log(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const closeViewDialog = () => {
    setselectedRecord(null);
    setViewDialogOpen(false);
  };

  useEffect(() => {
    fetchCompanyData(currentPage);
  }, [currentPage]);

  const fetchCompanyData = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(
        `api/admin/companies?page=${pageNumber}`
      );
      const companyData = response.data.data;
      setLinks(companyData.links);
      setCompanyData(companyData);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(`Error fetching company data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    fetchCompanyData();
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const deleteRecord = async (id) => {
    if (confirm("Are you sure you want to delete")) {
      try {
        const response = await axiosMerchant.post("api/admin/companies/delete", {
          id: id,
        });
        fetchCompanyData();
        toast.success(response.data.message);
      } catch (error) {
        toast.error(error);
      }
    }
  };

  return (
    <div>
      <PageTitle title={t("Companies")} />
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-2">
        <div>
          <Create onSubmitSuccess={handleSubmitSuccess} />
        </div>

        <div className="flex w-full max-w-sm items-center gap-x-2">
          <div className="input-container">
            <Input type="search" id="search" placeholder={t("Search")} />
          </div>
          <Button type="button" aria-label={t("Search")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
              />
            </svg>
          </Button>
          {/* <Button className="bg-orange-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </Button> */}
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t("#")}</TableHead>
              <TableHead>{t("Name")}</TableHead>
              <TableHead>{t("Email")}</TableHead>
              <TableHead>{t("License #")}</TableHead>
              <TableHead>{t("License Issue Date")}</TableHead>
              <TableHead>{t("License Expiry")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("View")}</TableHead>
              {/* <TableHead className="text-right">{t("Action")}</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <Skeleton className="h-[20px] rounded-full" />
                </TableCell>
              </TableRow>
            ) : companyData.data && companyData.data.length > 0 ? (
              companyData.data.map((company, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    {company.name}
                    <div className="flex gap-x-2 mt-2">
                      <button onClick={() => openEditDialog(company)} className="mr-2 py-[4px] px-2 border hover:bg-gray-100 rounded">
                        <Pencil className="p-1" /> {t("Edit")}
                      </button>
                      <button onClick={() => deleteRecord(company.id)} className="py-[4px] px-2 border hover:bg-gray-100 rounded">
                        <Trash2Icon className="p-1" /> {t("Delete")}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>{company.company.license_no}</TableCell>
                  <TableCell>{company.company.license_issue_date}</TableCell>
                  <TableCell>{company.company.license_expiry_date}</TableCell>
                  <TableCell>
                    {/* status === "New" ? ( */}
                    <span className="inline-block px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                      {t("Active")}
                    </span>

                    {/* <span className="inline-block px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                      Inactive
                    </span> */}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => openViewDialog(company)}
                      className="mr-2 py-[4px] px-2 border hover:bg-gray-100 rounded"
                      aria-label={t("View")}
                    >
                      <EyeIcon color="black" />
                    </button>
                  </TableCell>
                  {/* <TableCell className="text-right"> */}
                    {/* <DropdownMenu> */}
                      {/* <DropdownMenuTrigger asChild> */}
                        {/* <Button variant="secondary" className="h-10 w-10 p-0"> */}
                          {/* <span className="sr-only">Open menu</span> */}
                          {/* <MoreHorizontal className="h-4 w-4" /> */}
                        {/* </Button> */}
                      {/* </DropdownMenuTrigger> */}
                      {/* <DropdownMenuContent align="end"> */}
                        {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}

                        {/* <DropdownMenuSeparator /> */}
                        {/* <DropdownMenuItem */}
                          {/* onClick={() => openEditDialog(company)} */}
                        {/* > */}
                          {/* <EditIcon className="p-1" /> {t("Edit")} */}
                        {/* </DropdownMenuItem> */}
                        {/* <DropdownMenuItem */}
                          {/* onClick={() => deleteRecord(company.id)} */}
                        {/* > */}
                          {/* <Trash2Icon className="p-1" /> {t("Delete")} */}
                        {/* </DropdownMenuItem> */}
                      {/* </DropdownMenuContent> */}
                    {/* </DropdownMenu> */}
                  {/* </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* <Pagination links={links} /> */}
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {viewDialogOpen && (
        <View record={selectedRecord} onClose={closeViewDialog} />
      )}

      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )}
    </div>
  );
};

export default Companies;
