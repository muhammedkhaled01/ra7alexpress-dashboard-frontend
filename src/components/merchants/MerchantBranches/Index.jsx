import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import PageTitle from "../../admin/Layouts/PageTitle";
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

import { useLocation, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  EditIcon,
  Filter,
  MoreHorizontal,
  RefreshCcw,
  Trash2Icon,
  Plus,
  Pencil,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import Search from "@/components/misc/Search";

const MerchantBranch = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [merchantBranches, setMerchantBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Merchant Branch access") || hasRole("Merchant");
  const createAbility = can("Merchant Branch create") || hasRole("Merchant");
  const updateAbility = can("Merchant Branch update") || hasRole("Merchant");
  const deleteAbility = can("Merchant Branch delete") || hasRole("Merchant");

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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    if (!accessAbility) {
      navigate("unauthorized");
    }
    fetchMerchantBranches(currentPage);
  }, [currentPage]);

  const fetchMerchantBranches = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`merchant/branches?page=${pageNumber}`);
      setLinks(response.data.data.links);
      setMerchantBranches(response.data.data.data);
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
      const response = await axiosMerchant.get(`merchant/branches?query=${search}`);
      setMerchantBranches(response.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  const location = useLocation();
  useEffect(() => {
    if (location.state?.from === '/merchant/branches/create-branch') {
      handleRefresh();
    }
  }, [location])
  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchMerchantBranches();
  };

  const handleSubmitSuccess = () => {
    fetchMerchantBranches(currentPage);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <PageTitle title={t("Merchant Branches")} />
      <div className="flex flex-col md:flex-row gap-3 justify-between mt-2">
        <div>
          {createAbility && (
            <Button
              onClick={() => navigate("/merchant/branches/create-branch")}
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Create Branch")}</span>
            </Button>
          )}
        </div>

        <Search
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          onSearchSubmit={handleSearch}
          onRefresh={handleRefresh}
          showRefresh={refreshBtn}
          placeholder={t("Search Branches...")}
        />
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : merchantBranches && merchantBranches.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">#</TableHead>
                <TableHead>{t("Branch Name")}</TableHead>
                <TableHead>{t("Contact Number")}</TableHead>
                <TableHead>{t("Location")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchantBranches.map((branch, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.contact}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {branch.place?.en_name ?
                      `${branch.place.en_name}, ${branch.state?.en_name}` :
                      `${branch.city?.name}, ${branch.state?.en_name}`
                    }
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${branch.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {t(branch.status === 'active' ? 'Active' : 'Inactive')}
                    </span>
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
                        {updateAbility && (
                          <DropdownMenuItem
                            onClick={() => navigate(`/merchant/branches/edit-branch/${branch.id}`)}
                          >
                            <Pencil className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(branch)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <NoRecordFound />
        )}
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
          api={`merchant/branches/${selectedRecord?.id}/delete`}
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

export default MerchantBranch;
