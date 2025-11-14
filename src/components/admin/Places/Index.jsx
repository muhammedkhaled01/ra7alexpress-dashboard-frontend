import axiosMerchant from "@/axios";
import { useCallback, useEffect, useRef, useState } from "react";
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

import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Pencil,
  RefreshCcw,
  Trash2Icon,
  Upload,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import {
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import toast from "react-hot-toast";

const PlaceIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Place access");
  const createAbility = can("Place create");
  const updateAbility = can("Place update");
  const deleteAbility = can("Place delete");
  const importAbility = can("Place import");

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

  const fetchPlaces = useCallback(async (pageNumber = 1) => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosMerchant.get('places/index', {
        params: {
          page: pageNumber,
          per_page: itemsPerPage,
          ...(search && { query: search })
        }
      });

      if (response.data.data) {
        setPlaces(response.data.data.data || []);
        setLinks(response.data.data.links || []);
      } else {
        setPlaces([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
      setPlaces([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [search, itemsPerPage, accessAbility, navigate]);

  // Initial data fetch
  useEffect(() => {
    fetchPlaces(currentPage);
  }, [currentPage, fetchPlaces]);

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    setCurrentPage(1);
    setRefreshBtn(true);
    fetchPlaces(1);
  }, [fetchPlaces]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchPlaces(1);
  }, [fetchPlaces]);

  const handleSubmitSuccess = () => {
    fetchPlaces(currentPage);
  };
  const formRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await axiosMerchant.post(
        `import-governorate-state-place`,
        form
      );
      toast.success(response.data.message);
      fetchPlaces();
      formRef.current.reset();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
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
      <PageTitle title={t("Places")} />
      <div className="flex flex-wrap justify-between gap-3 mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                placeholder={t("Search Places")}
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
              {importAbility && (
                <Button
                  type="button"
                  variant="upload"
                  onClick={() =>
                    document.querySelector('input[type="file"]').click()
                  }
                >
                  <Upload className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>
      </div>
      <div className="hidden">
        <form onSubmit={handleSubmit} ref={formRef}>
          <CardContent>
            <div className="mt-1">
              <label htmlFor="file" className="block">
                {t("upload-file")}
              </label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  document.getElementById("hiddenSubmit").click();
                }}
                required
              />
              <button type="submit" id="hiddenSubmit">Submit</button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="mt-1 ml-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Upload")
              )}
            </Button>
          </CardFooter>
        </form>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        ) : places && places.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead isFixed>{t("Name")}</TableHead>
                <TableHead>{t("governorate")}</TableHead>
                <TableHead>{t("State")}</TableHead>
                <TableHead>{t("Country")}</TableHead>
                {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {places
                .filter((place) => place.en_name !== "" && place.ar_name !== "")
                .map((place, index) => (
                  <TableRow key={index}>
                    <TableCell isFixed>
                      {place.en_name}
                      {place.ar_name && ` / ${place.ar_name}`}
                      <div className="flex justify-center gap-x-2 mt-2">
                        {updateAbility && (
                          <Button onClick={() => openEditDialog(place)} variant="edit" size="xs">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {deleteAbility && (
                          <Button onClick={() => openDeleteAlert(place)} variant="delete" size="xs">
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{place?.state?.governorate?.en_name}</TableCell>
                    <TableCell>{place?.state?.en_name}</TableCell>
                    <TableCell>{place?.state?.country?.name}</TableCell>
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
                            <DropdownMenuItem onClick={() => openEditDialog(place)}>
                              <EditIcon className="p-1" />
                              {t("Edit")}
                            </DropdownMenuItem>
                          )}
                          {deleteAbility && (
                            <DropdownMenuItem onClick={() => openDeleteAlert(place)}>
                              <Trash2Icon className="p-1" />
                              {t("Delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell> */}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
      {links.length > 1 && (
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"places/delete"}
        />
      )}

      {
        editDialogOpen && (
          <Edit
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeEditDialog}
          />
        )
      }
    </div >
  );
};

export default PlaceIndex;
