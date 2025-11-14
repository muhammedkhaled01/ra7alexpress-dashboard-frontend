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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  EditIcon,
  Eye,
  EyeIcon,
  LucideLoader,
  MoreHorizontal,
  Plus,
  PrinterIcon,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, hasRole, printLabel } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import View from "./View";

const RealtimeQuery = () => {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Realtime Query access");
  const createAbility = can("Realtime Query create");
  const updateAbility = can("Realtime Query update");
  const deleteAbility = can("Realtime Query delete");

  // DELETE ALERT
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



  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`shipments/realtime-query`);
      setShipments(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };


  const handlePrint = async (shipment) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [shipment.id]: true }));
      const response = await axiosMerchant.get(`/shipments/printShipment`, {
        params: { tracking_no: shipment.tracking_no },
      });

      printLabel(response.data.html); // print backend html response
      setIsPrinting((prev) => ({ ...prev, [shipment.id]: false }));
    } catch (error) {
      setIsPrinting((prev) => ({ ...prev, [shipment.id]: false }));
      console.error("Error fetching shipment data for printing:", error);
    }
  };




  return (
    <div>
      <PageTitle title={t("Shipments")} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">

      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>{t("Tracking No")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("Sender")}</TableHead>
              <TableHead>{t("Name")}</TableHead>
              <TableHead>{t("Street Address")}</TableHead>
              <TableHead>{t("Amount")}</TableHead>
              <TableHead>{t("Action")}</TableHead>

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
                  <TableCell className="font-medium">
                    {shipment.tracking_no}
                  </TableCell>
                  <TableCell className="font-medium">
                    {shipment.status}
                  </TableCell>
                  <TableCell>
                    {shipment?.shipper?.name} <br />{" "}
                    {shipment?.shipper?.contact}{" "}
                  </TableCell>
                  <TableCell>{shipment.consignee?.name}</TableCell>
                  <TableCell>{shipment.consignee?.streetAddress}</TableCell>
                  <TableCell>
                    {shipment.payment_type === "COD" ? shipment.amount : "Paid"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button

                        onClick={() => handlePrint(shipment)}
                        disabled={isPrinting[shipment.id]}
                      >
                        <PrinterIcon className="h-6 w-6" />{" "}
                        {isPrinting[shipment.id] && (
                          <LucideLoader className="h-4 w-4 animate-spin mr-2 inline-block" />
                        )}
                      </Button>

                      {/* View Component */}
                      <View
                        tigger={
                          <Button
                            size="icon"
                            className="ml-1"
                            variant="default"
                          >
                            <Eye className="h-6 w-6" />
                          </Button>
                        }
                        record={shipment}
                      />
                    </div>
                  </TableCell>

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

      </div>


    </div>
  );
};

export default RealtimeQuery;
