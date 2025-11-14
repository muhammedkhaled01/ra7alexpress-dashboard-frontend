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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import {
  Download,
  EditIcon,
  Eye,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Create from "./Create";
import Edit from "./Edit";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import Search from "@/components/misc/Search";
import { Badge } from "@/components/ui/badge";
import { link } from "fs";

const LegalDocuments = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Legal Document access");
  const createAbility = can("Legal Document create");
  const updateAbility = can("Legal Document update");
  const deleteAbility = can("Legal Document delete");

  // DELETE ALERT
  const openDeleteAlert = (record) => {
    setSelectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setSelectedRecord(null);
    setDeleteAlert(false);
  };

  const openEditDialog = (record) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setSelectedRecord(null);
    setEditDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchDocuments(currentPage);
  }, [currentPage]);

  const fetchDocuments = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`legal-documents?page=${pageNumber}`);
      console.log("API Response:", response.data);
      
      // Handle sendResponse structure - data contains the paginated results
      if (response.data.success && response.data.data) {
        const paginatedData = response.data.data;
        setDocuments(paginatedData.data || []);
        setLinks(paginatedData.links || []);
      } else {
        setDocuments([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
      setDocuments([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`legal-documents?search=${search}`);
      console.log("Search Response:", response.data);
      
      // Handle sendResponse structure for search
      if (response.data.success && response.data.data) {
        const paginatedData = response.data.data;
        setDocuments(paginatedData.data || []);
        setLinks(paginatedData.links || []);
      } else {
        setDocuments([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
      setDocuments([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchDocuments(currentPage);
  };

  const handleSubmitSuccess = () => {
    fetchDocuments(currentPage);
  };

  const handleDownload = (document) => {
    window.open(`/api/legal-documents/${document.id}/download`, '_blank');
  };

  return (
    <div>
      <PageTitle title={t("Legal Documents")} />
      <div className="flex flex-wrap gap-3 mt-2 justify-between">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <div className="flex flex-row gap-x-2">
          <Search
            searchValue={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            onSearchSubmit={handleSearch}
            onRefresh={handleRefresh}
            showRefresh={refreshBtn}
            placeholder={t("Search Legal Documents")}
          />
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : documents && documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">#</TableHead>
                <TableHead>{t("Document ID")}</TableHead>
                <TableHead isFixed>{t("Document Name")}</TableHead>
                <TableHead>{t("Type")}</TableHead>
                <TableHead>{t("Expiry Date")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document, index) => {
                const isExpired = document.status === 'expired';
                const isExpiringSoon = new Date(document.expiry_date) - new Date() <= 30 * 24 * 60 * 60 * 1000;
                
                return (
                  <TableRow 
                    key={document.id}
                    className={isExpired ? 'bg-red-50 dark:bg-red-900/10' : ''}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{document.document_id}</TableCell>
                    <TableCell isFixed>{document.document_name}</TableCell>
                    <TableCell>{document.type}</TableCell>
                    <TableCell>
                      <span className={isExpiringSoon ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                        {new Date(document.expiry_date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={document.status === 'valid' ? 'success' : 'destructive'}>
                        {document.status === 'valid' ? t('Valid') : t('Expired')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t("Open menu")}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(document)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("View/Download")}
                          </DropdownMenuItem>
                          {updateAbility && (
                            <DropdownMenuItem onClick={() => openEditDialog(document)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("Edit")}
                            </DropdownMenuItem>
                          )}
                          {deleteAbility && (
                            <DropdownMenuItem onClick={() => openDeleteAlert(document)}>
                              <Trash2Icon className="mr-2 h-4 w-4" />
                              {t("Delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <NoRecordFound />
        )}

        {!loading && links && Array.isArray(links) && links.length > 0 && (
          <Pagination links={links} onPageChange={handlePageChange} />
        )}
      </div>

      {deleteAlert && (
        console.log("lings", selectedRecord, links, "why"),
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"legal-documents/delete"}
        />
      )}

      {editDialogOpen && (
        <Edit
          record={selectedRecord}
          onSubmitSuccess={handleSubmitSuccess}
          onClose={closeEditDialog}
        />
      )}
    </div>
  );
};

export default LegalDocuments;
