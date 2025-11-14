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
  Download,
  EditIcon,
  EyeIcon,
  Filter,
  MoreHorizontal,
  RefreshCcw,
  Trash2Icon,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Pencil,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import ViewItems from "./ViewItems";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";
import Search from "@/components/misc/Search";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/misc/Select";

const ComplianceChecklistIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [checklists, setChecklists] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewItemsDialogOpen, setViewItemsDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Compliance Checklist access");
  const createAbility = can("Compliance Checklist create");
  const updateAbility = can("Compliance Checklist update");
  const deleteAbility = can("Compliance Checklist delete");

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

  const openViewItemsDialog = (record) => {
    setselectedRecord(record);
    setViewItemsDialogOpen(true);
  };

  const closeViewItemsDialog = () => {
    setselectedRecord(null);
    setViewItemsDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchChecklists(currentPage);
  }, [currentPage, categoryFilter, statusFilter]);

  const fetchChecklists = async (pageNumber) => {
    setLoading(true);
    try {
      let url = `compliance-checklists?page=${pageNumber}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const response = await axiosMerchant.get(url);
      setLinks(response.data.data.links);
      setChecklists(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      let url = `compliance-checklists?query=${search}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const response = await axiosMerchant.get(url);
      setChecklists(response.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setRefreshBtn(false);
    fetchChecklists();
  };

  const handleSubmitSuccess = () => {
    fetchChecklists(currentPage);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        setRefreshBtn(true);
        handleSearch();
      } else {
        setRefreshBtn(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const getStatusBadge = (status) => {
    return (
      <Badge
        variant={status === 'Compliant' ? 'default' : 'destructive'}
        className={status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
      >
        {status === 'Compliant' ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <XCircle className="w-3 h-3 mr-1" />
        )}
        {t(status)}
      </Badge>
    );
  };

  const categories = [
    { value: '', label: t('All Categories') },
    { value: 'Vehicle Safety', label: t('Vehicle Safety') },
    { value: 'Warehouse Safety', label: t('Warehouse Safety') },
    { value: 'Equipment Safety', label: t('Equipment Safety') },
    { value: 'Personal Safety', label: t('Personal Safety') },
    { value: 'Fire Safety', label: t('Fire Safety') },
    { value: 'Health & Safety', label: t('Health & Safety') },
    { value: 'Environmental Safety', label: t('Environmental Safety') },
    { value: 'Quality Control', label: t('Quality Control') },
  ];

  const statuses = [
    { value: '', label: t('All Statuses') },
    { value: 'Compliant', label: t('Compliant') },
    { value: 'Non-Compliant', label: t('Non-Compliant') },
  ];

  return (
    <div>
      <PageTitle title={t("Compliance Checklists")} />
      <div className="flex flex-wrap gap-2 mt-2 justify-between">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <div className="flex flex-col w-full md:flex-row gap-2">
          <div className="flex flex-col w-full md:flex-row gap-x-2">
            <Select
              value={categories.find(cat => cat.value === categoryFilter)}
              onChange={(option) => setCategoryFilter(option?.value || '')}
              options={categories}
              className="basic-multi-select min-w-[150px]"
              classNamePrefix="select"
              placeholder={t("Filter by Category")}
              isClearable
            />
            <Select
              value={statuses.find(status => status.value === statusFilter)}
              onChange={(option) => setStatusFilter(option?.value || '')}
              options={statuses}
              className="basic-multi-select min-w-[130px]"
              classNamePrefix="select"
              placeholder={t("Filter by Status")}
              isClearable
            />
          </div>
          <Search
            searchValue={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            onSearchSubmit={handleSearch}
            onRefresh={handleRefresh}
            showRefresh={refreshBtn}
            placeholder={t("Search Compliance Checklists")}
          />
          <Button type="button" variant="download" onClick={e => setShowExport(true)}>
            <Download />
          </Button>
        </div>
      </div >

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : checklists && checklists.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">#</TableHead>
                <TableHead isFixed>{t("Name")}</TableHead>
                <TableHead>{t("Category")}</TableHead>
                <TableHead>{t("Last Completed")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Items Count")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checklists.map((checklist, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed className="font-medium">{checklist.name}</TableCell>
                  <TableCell>{checklist.category}</TableCell>
                  <TableCell>
                    {checklist.last_completed 
                      ? new Date(checklist.last_completed).toLocaleString() 
                      : t("Never")
                    }
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(checklist.status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {checklist.items ? checklist.items.length : 0} {t("items")}
                    </Badge>
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
                        <DropdownMenuItem
                          onClick={() => openViewItemsDialog(checklist)}
                        >
                          <ClipboardCheck className="p-1" /> {t("View Items")}
                        </DropdownMenuItem>
                        {updateAbility && (
                          <DropdownMenuItem
                            onClick={() => openEditDialog(checklist)}
                          >
                            <Pencil className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(checklist)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              <Pagination
                links={links}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </TableBody>
          </Table>
        ) : (
          <NoRecordFound />
        )}
      </div>

      {
        deleteAlert && (
          <DeleteAlert
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeDeleteAlert}
            api={"compliance-checklists/delete"}
          />
        )
      }
      {
        editDialogOpen && (
          <Edit
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeEditDialog}
          />
        )
      }
      {
        viewItemsDialogOpen && (
          <ViewItems
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeViewItemsDialog}
          />
        )
      }

      {showExport && (
        <ExportDialog
          model="compliance-checklists"
          endpoint="compliance-checklists/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "last_completed", label: "Last Completed" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div >
  );
};

export default ComplianceChecklistIndex; 