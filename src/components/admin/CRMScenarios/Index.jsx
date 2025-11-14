import axiosMerchant from "@/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState, useRef } from "react";
import { debounce } from "lodash";
import NoRecordFound from "../../NoRecordFound";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";

import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import Pagination from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import { can, handleError } from "@/utils/helpers";
import {
  EditIcon,
  MoreHorizontal,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Create from "./Create";
import Edit from "./Edit";

const CRMScenariosIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [scenarios, setScenarios] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const debouncedFetchRef = useRef(null);

  const handleCategoryChange = (value) => {
    setCategory(value);
    fetchScenarios({ search, category: value, tags }, 1);
  };

  useEffect(() => {
    debouncedFetchRef.current = debounce((filters) => {
      fetchScenarios(filters, 1);
    }, 500);
    return () => {
      if (debouncedFetchRef.current) {
        debouncedFetchRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (debouncedFetchRef.current) {
      debouncedFetchRef.current({ search, category, tags });
    }
  }, [search, tags]);

  const handleDebouncedInputChange = (value, setter, key) => {
    setter(value);
    if (debouncedFetchRef.current) {
      debouncedFetchRef.current({ search: key === 'search' ? value : search, category: category, tags });
    }
  };

  const fetchScenarios = async ({ search, category, tags }, pageNumber) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNumber);
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (tags) params.append('tags', tags);

      const response = await axiosMerchant.get(`scenarios?${params.toString()}`);
      setLinks(response.data.data.links);
      setScenarios(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const { t } = useTranslation();

  const categories = [
    { value: '', label: t('Select Category') },
    { value: 'delivery', label: t('Delivery Issues') },
    { value: 'payment', label: t('Payment Issues') },
    { value: 'account', label: t('Account Issues') },
    { value: 'other', label: t('Other') }
  ];
  const createAbility = can("CRM Scenario create");
  const updateAbility = can("CRM Scenario update");
  const deleteAbility = can("CRM Scenario delete");

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
  const handleRefresh = () => {
    setSearch("");
    setTags("");
    setCategory("");
    setRefreshBtn(false);
    fetchScenarios(1);
  };

  const handleSubmitSuccess = () => {
    fetchScenarios(currentPage);
  };

  return (
    <div>
      <PageTitle title={t("Scenarios")} />
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="input-container">
              <Select
                options={categories.map(cat => ({
                  value: cat.value,
                  label: cat.label
                }))}
                value={categories.find(cat => cat.value === category)}
                onChange={(opt) => handleCategoryChange(opt.value)}
                isRequired
              />
            </div>
            <div className="input-container">
              <Input
                name="tags"
                type="text"
                placeholder={t("Tags (comma separated)")}
                value={tags}
                onChange={(e) => handleDebouncedInputChange(e.target.value, setTags)}
              />
            </div>
            <div className="input-container">
              <Input
                name="search"
                type="text"
                value={search}
                placeholder={t("Search scenarios")}
                onChange={(e) => handleDebouncedInputChange(e.target.value, setSearch)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead isFixed>{t("Scenario Title")}</TableHead>
              <TableHead>{t("Description")}</TableHead>
              <TableHead>{t("Tags")}</TableHead>
              <TableHead>{t("Category")}</TableHead>
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
            ) : scenarios && scenarios.length > 0 ? (
              scenarios.map((scenario, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>{scenario?.title || ""}</TableCell>
                  <TableCell>{scenario?.description || ""}</TableCell>
                  <TableCell>
                    {scenario?.tags?.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="mr-1">
                        {tag}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell className="capitalize">{t(scenario?.category) || ""}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="h-8">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {updateAbility && (
                          <DropdownMenuItem
                            onClick={() => openEditDialog(scenario)}
                          >
                            <EditIcon className="w-4 h-4 mr-2" />
                            {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(scenario)}
                          >
                            <Trash2Icon className="w-4 h-4 mr-2" />
                            {t("Delete")}
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
        <Pagination links={links} onPageChange={handlePageChange} />
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"scenarios/delete"}
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

export default CRMScenariosIndex;
