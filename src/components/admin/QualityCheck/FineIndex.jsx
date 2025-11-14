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

import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  EditIcon,

  MoreHorizontal,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";

const FineIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fines, setFines] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Fine access")
  const createAbility = can("Fine create")
  const updateAbility = can("Fine update")
  const deleteAbility = can("Fine delete")

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

  const fetchFines = React.useCallback(async (pageNumber, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pageNumber);
      if (searchQuery) {
        params.append("query", searchQuery);
      }
      const response = await axiosMerchant.get(`fines?${params.toString()}`);
      setLinks(response.data.data.links || []);
      setFines(response.data.data.data || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    setSearch("");
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchFines(1, "");
    }
  };

  const handleSubmitSuccess = () => {
    fetchFines(currentPage, debouncedSearch);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
  }, [accessAbility, navigate]);

  useEffect(() => {
    fetchFines(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchFines]);









  return (
    <div>
      <div className="flex justify-between mt-2">
        <PageTitle title={t("Fines")} />

        <div className="flex gap-x-2">
          <Input
            name="search"
            type="text"
            className="w-[200px]"
            value={search}
            id="search"
            placeholder={t("Search Fines...")}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              search && (
                <RefreshCcw
                  className="w-4 h-4 cursor-pointer"
                  onClick={handleRefresh}
                />
              )
            }
          />
          <Button type="button" variant="refresh" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead isFixed>{t("Tracking No")}</TableHead>
              <TableHead>{t("Driver")}</TableHead>
              <TableHead>{t("Amount")}</TableHead>
              <TableHead>{t("Date")}</TableHead>
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
            ) : fines && fines.length > 0 ? (
              fines.map((fine, index) => (
                <TableRow key={index}>
                  <TableHead className="w-[100px] sticky left-0 bg-white z-10">
                    #
                  </TableHead>
                  <TableCell isFixed>{fine.shipment?.tracking_no}</TableCell>
                  <TableCell>{fine.driver?.name}</TableCell>
                  <TableCell>{fine.amount}</TableCell>
                  <TableCell>
                    {new Date(fine.created_at).toLocaleString()}
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
                            onClick={() => openEditDialog(fine)}
                          >
                            <EditIcon className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        } */}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(fine)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        )}
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
          api={"fines/delete"}
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

export default FineIndex;
