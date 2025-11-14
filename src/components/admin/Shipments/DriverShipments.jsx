import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Link, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Eye, RefreshCcw } from "lucide-react";
import { can, handleError, isAuthorized } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import View from "./DriverShipmentsView";

const DriverShipments = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Shipment access");
  const createAbility = can("Shipment create");
  const updateAbility = can("Shipment update");
  const deleteAbility = can("Shipment delete");

  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const openEditDialog = (record) => {
    setselectedRecord(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End
  useEffect(() => {
    if (!accessAbility) {
      navigate("unauthorized");
    }
    fetchShipments(currentPage);
  }, [currentPage]);

  const fetchShipments = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(
        `shipments/driver_shipments?page=${pageNumber}`
      );
      // setLinks(response.data.data.links);
      setShipments(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(
        `shipments/driver_shipments?query=${search}`
      );
      setShipments(response.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchShipments();
  };

  const handleSubmitSuccess = () => {
    fetchShipments(currentPage);
  };

  if (!isAuthorized(["Driver Runsheet access"])) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        <PageTitle title={t(`Shipments`)} />
        <form action="" onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              id="search"
              placeholder={t("Search")}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
                />
              </svg>
            </Button>
            {refreshBtn && (
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>{t("Driver")}</TableHead>
              <TableHead>{t("Total Shipments")}</TableHead>
              <TableHead>{t("COD Shipments")}</TableHead>
              <TableHead>{t("Paid Shipments")}</TableHead>
              <TableHead>{t("COD Amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : shipments && shipments.length > 0 ? (
              shipments.map((shipment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{shipment.driver?.name}</TableCell>
                  <TableCell>{shipment.shipment_count}</TableCell>
                  <TableCell>{shipment.cod_count}</TableCell>
                  <TableCell>{shipment.paid_count}</TableCell>
                  <TableCell>{shipment.cod_amount}</TableCell>
                  <TableCell>
                    <View
                      tigger={
                        <Button size="icon" className="ml-1" variant="default">
                          <Eye className="h-6 w-6" />
                        </Button>
                      }
                      record={shipment.shipments}
                    />
                  </TableCell>

                  {/* <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" className="h-10 w-10 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {updateAbility && (
                                                    <Link to={"/shipments/edit/" + shipment.id}>
                                                        <DropdownMenuItem>
                                                            <EditIcon className="p-1" /> {t("Edit")}
                                                        </DropdownMenuItem>
                                                    </Link>
                                                )}
                                                {deleteAbility && (
                                                    <DropdownMenuItem
                                                        onClick={() => openDeleteAlert(shipment)}
                                                    >
                                                        <Trash2Icon className="p-1" /> {t("Delete")}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"shipments/delete"}
        />
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

export default DriverShipments;
