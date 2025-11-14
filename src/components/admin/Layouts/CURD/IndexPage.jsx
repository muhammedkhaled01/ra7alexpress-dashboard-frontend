import axiosMerchant from "@/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import NoRecordFound from "../../../NoRecordFound";
import { Button } from "../../../ui/button";
import PageTitle from "../../Layouts/PageTitle";

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
  EditIcon,
  Filter,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const IndexPage = ({ feature }) => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createComponent } = feature;
  const { editComponent } = feature;

  const accessAbility = can(`${feature.permissionKey} access`);
  const createAbility = can(`${feature.permissionKey} create`);
  const updateAbility = can(`${feature.permissionKey} update`);
  const deleteAbility = can(`${feature.permissionKey} delete`);

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

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchItems(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchItems = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(
        `${feature.baseEndpoint}?page=${pageNumber}`
      );
      console.log(response.data);
      setLinks(
        response?.data?.data?.meta?.links || response.data?.data?.links || []
      );
      setItems(response.data.data.data);
      console.log(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(
        `${feature.baseEndpoint}?query=${search}`
      );
      setItems(response.data.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (scenario) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", scenario?.id);
      formData.append("is_active", scenario?.is_active == 1 ? 0 : 1);
      const response = await axiosMerchant.post(
        `${feature.baseEndpoint}/update`,
        formData
      );
      toast.success(response.data.message);
      fetchItems();
    } catch (error) {
      handleError(error);
      console.error("Failed to submit data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchItems();
  };

  const handleSubmitSuccess = () => {
    fetchItems(currentPage);
  };

  return (
    <div>
      <PageTitle title={feature.title} />
      <div className="flex flex-col md:flex-row gap-3 justify-between mt-2">
        <div>
          {typeof createComponent === "function"
            ? createComponent({
              onSubmitSuccess: handleSubmitSuccess,
              feature,
            })
            : createComponent}
        </div>
        <form onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={`${t("Search")} ${t(feature?.title) ?? ""}...`}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                refreshBtn && search.trim() !== "" && (
                  <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                )
              }
            />
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {feature.isIndexActive && (
                <TableHead className="w-[100px]">#</TableHead>
              )}
              {feature.tableHeadsNames.map((headName) => {
                return <TableHead isFixed={feature?.isFixedColumn === headName}>{headName}</TableHead>;
              })}
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
            ) : items && items.length > 0 ? (
              items.map((item, index) => (
                <TableRow key={index}>
                  {feature.isIndexActive && (
                    <TableCell className="font-medium">{index + 1}</TableCell>
                  )}
                  {feature.tableKeys.map((key, keyIndex) => {
                    return (
                      <TableCell isFixed={feature?.isFixedColumn === feature.tableHeadsNames[keyIndex]}>
                        {typeof getValueFromKey(item, key) === "object"
                          ? JSON.stringify(getValueFromKey(item, key))
                          : String(getValueFromKey(item, key) || "")}
                        {keyIndex === 0 && (
                          <div className="flex gap-x-2 mt-2">
                            {updateAbility && feature.isEdit && (
                              <Button onClick={() => openEditDialog(item)} variant="edit" size="xs">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {deleteAbility && feature.isDelete && (
                              <Button onClick={() => openDeleteAlert(item)} variant="delete" size="xs">
                                <Trash2Icon className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}

                  {/* <TableCell className="text-right"> */}
                    {/* <DropdownMenu> */}
                      {/* <DropdownMenuTrigger asChild> */}
                        {/* <Button variant="secondary" className="h-8"> */}
                          {/* <MoreHorizontal /> */}
                        {/* </Button> */}
                      {/* </DropdownMenuTrigger> */}
                      {/* <DropdownMenuContent> */}
                        {/* {updateAbility && feature.isEdit && ( */}
                          {/* <DropdownMenuItem */}
                            {/* onClick={() => openEditDialog(item)} */}
                          {/* > */}
                            {/* <EditIcon className="w-4 h-4 mr-2" /> */}
                            {/* {t("Edit")} */}
                          {/* </DropdownMenuItem> */}
                        {/* )} */}
                        {/* {deleteAbility && feature.isDelete && ( */}
                          {/* <DropdownMenuItem */}
                            {/* onClick={() => openDeleteAlert(item)} */}
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
        <Pagination links={links} onPageChange={handlePageChange} />
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={`${feature.baseEndpoint}/delete`}
        />
      )}
      {editDialogOpen &&
        (typeof editComponent === "function"
          ? editComponent({
            onSubmitSuccess: handleSubmitSuccess,
            record: selectedRecord,
            onClose: closeEditDialog,
            feature,
          })
          : editComponent)}
    </div>
  );
};

export default IndexPage;

function getValueFromKey(item, key) {
  const keysWithFallback = key.split("??").map((k) => k.trim());
  for (const keyPart of keysWithFallback) {
    const keys = keyPart.split(".");
    let value = item;

    for (let i = 0; i < keys.length; i++) {
      if (value === null || value === undefined) {
        value = undefined;
        break;
      }
      value = value[keys[i]];
    }

    if (value !== undefined && value !== null) return value;
  }

  return "";
}
