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
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, capitalize, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const DestinationTransferTaskIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [transferTasks, setTransferTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = true; // can("TransferTask access")
  const createAbility = true; // can("TransferTask create")
  const updateAbility = true; // can("TransferTask update")
  const deleteAbility = true; // can("TransferTask delete")

  // DELETE ALERT
  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End
  useEffect(() => {
    if (!accessAbility) {
      navigate("unauthorized");
    }
    fetchTransferTasks(currentPage);
  }, [currentPage]);

  const fetchTransferTasks = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(
        `transfer_tasks?page=${pageNumber}`
      );
      console.log(response.data.data.data);
      setLinks(response.data.data.links);
      setTransferTasks(response.data.data.data);
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
      const response = await axiosMerchant.get(`transfer_tasks?query=${search}`);
      setTransferTasks(response.data.data);
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
    fetchTransferTasks();
  };

  const handleSubmitSuccess = () => {
    fetchTransferTasks(currentPage);
  };

  return (
    <div>
      <PageTitle title={t("Truck Arrival")} />
      <div className="flex justify-between mt-2">
        <div>
          {createAbility && (
            <Link to={"create"}>
              <Button type="button" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>{t("Create Transfer Task")}</span>
              </Button>
            </Link>
          )}
        </div>

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
            <Button variant="filter" type="submit">
              <Filter />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>{t("Origin")}</TableHead>
              <TableHead>{t("Truck Number Plate")}</TableHead>
              <TableHead>{t("Driver Name")}</TableHead>
              <TableHead>{t("Driver Phone")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("View")}</TableHead>
              <TableHead>{t("Created at")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : transferTasks && transferTasks.length > 0 ? (
              transferTasks.map((transferTask, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{transferTask.origin?.name}</TableCell>
                  <TableCell>{transferTask.truck?.number_plate}</TableCell>
                  <TableCell>{transferTask.truck_driver?.name}</TableCell>
                  <TableCell>
                    {transferTask.truck_driver?.phone_number}
                  </TableCell>
                  <TableCell>
                    <Badge>{capitalize(transferTask.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link to={"view/" + transferTask.id}>
                      <Button size="icon" className="ml-1" variant="default">
                        <Eye className="h-6 w-6" />
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {new Date(transferTask.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
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
                        {/* {updateAbility &&
                          <DropdownMenuItem
                            onClick={() => openEditDialog(transferTask)}
                          >
                            <EditIcon className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        } */}
                        {/* {deleteAbility &&
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(transferTask)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        } */}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          api={"transferTasks/delete"}
        />
      )}
      {/* {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )} */}
    </div>
  );
};

export default DestinationTransferTaskIndex;
