import axiosMerchant from "@/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useEffect, useState } from "react";
import NoRecordFound from "../../NoRecordFound";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import Select from "../../misc/Select";

import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import Pagination from "@/components/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { can, handleError } from "@/utils/helpers";
import {
  Download,
  EditIcon,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Create from "./Create";
import Edit from "./Edit";
import ExportDialog from "@/components/misc/ExportDialog";

const GovernorateIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [governorates, setGovernorates] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Governorate access");
  const createAbility = can("Governorate create");
  const updateAbility = can("Governorate update");
  const deleteAbility = can("Governorate delete");
  const exportAbility = can("Governorate export");

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

  // Edit & Delete & Pagination Logic - End

  const fetchGovernorates = useCallback(async (pageNumber = 1) => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axiosMerchant.get('governorates/index', {
        params: {
          page: pageNumber,
          per_page: itemsPerPage,
          ...(search && { query: search })
        }
      });
      
      if (response.data.data) {
        setGovernorates(response.data.data.data || []);
        setLinks(response.data.data.links || []);
      } else {
        setGovernorates([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
      setGovernorates([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [search, itemsPerPage, accessAbility, navigate]);

  // Initial data fetch
  useEffect(() => {
    fetchGovernorates(currentPage);
  }, [currentPage, fetchGovernorates]);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    setRefreshBtn(true);
    fetchGovernorates(1);
  }, [fetchGovernorates]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchGovernorates(1);
  }, [fetchGovernorates]);

  const handleSubmitSuccess = () => {
    fetchGovernorates(currentPage);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        setRefreshBtn(true);
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);
  return (
    <div>
      <PageTitle title={t("Governorates")} />
      <div className="flex justify-start mt-2 items-center flex-wrap gap-2 ">
        <div className="flex-1 md:flex-auto">
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">


          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                placeholder={t("Search-governorate")}
                onChange={(e) => setSearch(e.target.value)}
                icon={
                  refreshBtn && (
                    <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                  )
                }
              />
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </form>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <Select
              value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
              onChange={(selectedOption) => {
                setItemsPerPage(Number(selectedOption.value));
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: '5' },
                { value: 8, label: '8' },
                { value: 15, label: '15' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 100, label: '100' }
              ]}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
          {exportAbility && (
            <div>
              <Button type="button" variant="download" onClick={e => setShowExport(true)}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead className="w-[100px]">#</TableHead> */}
              <TableHead>{t("Name")} (En / Ar)</TableHead>
              <TableHead>{t("Country")}</TableHead>
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
            ) : governorates && governorates.length > 0 ? (
              governorates.map((governorate, index) => (
                <TableRow key={index}>
                  <TableCell isFixed>
                    {governorate.en_name} / {governorate.ar_name}
                    <div className="flex justify-center gap-x-2 mt-2">
                      {updateAbility && (
                        <Button onClick={() => openEditDialog(governorate)} variant="edit" size="xs">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        )}
                        {deleteAbility && (
                        <Button onClick={() => openDeleteAlert(governorate)} variant="delete" size="xs">
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                        )}
                    </div>
                  </TableCell>

                  <TableCell>{governorate.country?.name}</TableCell>
                  {/* <TableCell className="text-right"> */}
                  {/* <DropdownMenu> */}
                  {/* <DropdownMenuTrigger asChild> */}
                  {/* <Button variant="secondary" className="h-8"> */}
                  {/* <MoreHorizontal /> */}
                  {/* </Button> */}
                  {/* </DropdownMenuTrigger> */}
                  {/* <DropdownMenuContent> */}
                  {/* {updateAbility && ( */}
                  {/* <DropdownMenuItem */}
                  {/* onClick={() => openEditDialog(governorate)} */}
                  {/* > */}
                  {/* <EditIcon className="w-4 h-4 mr-2" /> */}
                  {/* {t("Edit")} */}
                  {/* </DropdownMenuItem> */}
                  {/* )} */}
                  {/* {deleteAbility && ( */}
                  {/* <DropdownMenuItem */}
                  {/* onClick={() => openDeleteAlert(governorate)} */}
                  {/* > */}
                  {/* <Trash2Icon className="w-4 h-4 mr-2" /> */}
                  {/* {t("Delete")} */}
                  {/* </DropdownMenuItem> */}
                  {/* )} */}
                  {/* </DropdownMenuContent> */}
                  {/* </DropdownMenu> */}
                  {/* </TableCell> */}
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
        {links.length > 1 && (
          <Pagination links={links} onPageChange={handlePageChange} />
        )}
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"governorates/delete"}
        />
      )}
      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )}

      {showExport && (
        <ExportDialog
          model="governorates"
          endpoint="governorates/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "en_name", label: "English Name" },
            { key: "ar_name", label: "Arabic Name" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default GovernorateIndex;
