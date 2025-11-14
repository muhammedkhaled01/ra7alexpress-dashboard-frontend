import axiosMerchant from "@/axios";
import React, { useEffect, useState, useCallback } from "react";
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

import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  EditIcon,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";

const ShipmentStatusIndex = () => {
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Shipment Status access");
  const createAbility = can("Shipment Status create");
  const updateAbility = can("Shipment Status update");
  const deleteAbility = can("Shipment Status delete");

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

  // Edit & Delete & Pagination Logic - End
  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchData();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`statuses/all?query=${search}`);
      const staticStatuses = response.data.data.static.map((status) => ({
        ...status,
        type: "Static",
      }));
      const systemStatuses = response.data.data.system.map((status) => ({
        ...status,
        type: "System",
      }));

      const combinedStatuses = [...systemStatuses, ...staticStatuses];
      setStatuses(combinedStatuses);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        setRefreshBtn(true);
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`statuses/all`);
      const staticStatuses = response.data.data.static.map((status) => ({
        ...status,
        type: "Static",
      }));
      const systemStatuses = response.data.data.system.map((status) => ({
        ...status,
        type: "System",
      }));

      // Combine the statuses
      const combinedStatuses = [...systemStatuses, ...staticStatuses];
      setStatuses(combinedStatuses);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    fetchData();
  };

  return (
    <div>
      <PageTitle title={t("Statuses")} />
      <div className="flex justify-between mt-2">
        <div>
          {createAbility && (
            <Create onSubmitSuccess={handleSubmitSuccess} />
          )}
        </div>

        <div className="flex gap-x-2">
          <Input
            name="search"
            type="text"
            className="w-[200px]"
            value={search}
            id="search"
            placeholder={t("Search Statuses...")}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              refreshBtn && (
                <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
              )
            }
          />
          <Button variant="refresh" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead isFixed>{t("Type")}</TableHead>
              <TableHead>{t("Name")}</TableHead>
              <TableHead>{t("Description")}</TableHead>
              {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : statuses && statuses.length > 0 ? (
              statuses.map((status, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.type === "System"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                    >
                      {t(status.type)}
                    </span>
                    {status.type !== "Static" && (
                      <div className="flex justify-center gap-x-2 mt-2">
                        {updateAbility && (
                          <Button onClick={() => openEditDialog(status)} variant="edit" size="xs" disabled={status.type === "Static"}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {deleteAbility && (
                          <Button onClick={() => openDeleteAlert(status)} variant="delete" size="xs" disabled={status.type === "Static"}>
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>{status.label}</TableCell>
                  <TableCell>{status.description}</TableCell>
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
                          <DropdownMenuItem
                            onClick={() =>
                              status.type !== "Static" && openEditDialog(status)
                            }
                            disabled={status.type === "Static"}
                          >
                            <EditIcon className="p-1" />
                            {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() =>
                              status.type !== "Static" &&
                              openDeleteAlert(status)
                            }
                            disabled={status.type === "Static"}
                          >
                            <Trash2Icon className="p-1" />
                            {t("Delete")}
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
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"statuses/delete"}
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

export default ShipmentStatusIndex;
