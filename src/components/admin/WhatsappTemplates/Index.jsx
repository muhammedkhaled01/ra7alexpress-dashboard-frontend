import axiosMerchant from "@/axios";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Pencil, EyeIcon, RefreshCcw } from "lucide-react";
import Loader from "@/components/Loader";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { can, handleError } from "@/utils/helpers";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TemplateEditDialog from "./Edit";
import WhatsappView from "./View";
import Select from "@/components/misc/Select";

const TemplateIndexTabs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("whatsapp");
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const canAccess =
    can("Whatsapp Template access") || can("Email Template access");
  const canUpdateWhats = can("Whatsapp Template update");
  const canUpdateEmail = can("Email Template update");

  if (!canAccess) return navigate("/unauthorized");

  const endpoint = useMemo(
    () => (activeTab === "whatsapp" ? "whatsapp_templates" : "email_templates"),
    [activeTab]
  );

  useEffect(() => {
    setCurrentPage(1); // لما تغيّر التاب ارجع لأول صفحة
    setSearch("");
  }, [activeTab]);

  useEffect(() => {
    fetchTemplates(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, endpoint]);

  const normalizeAndSet = (res, isSearch = false) => {
    // يدعم حالتين: paginate (links+data) أو مصفوفة مباشرة عند البحث
    const payload = res?.data?.data;
    if (!payload) return setTemplates([]);
    if (Array.isArray(payload) || isSearch) {
      setTemplates(Array.isArray(payload) ? payload : []);
      setLinks([]);
    } else {
      setTemplates(payload.data || []);
      setLinks(payload.links || []);
    }
  };

  const fetchTemplates = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`${endpoint}?page=${pageNumber}&per_page=${itemsPerPage}`);
      normalizeAndSet(response, false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(
        `${endpoint}?query=${encodeURIComponent(search)}`
      );
      normalizeAndSet(response, true);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasQuery = search.trim() !== "";
      setRefreshBtn(hasQuery);
      hasQuery ? handleSearch() : fetchTemplates(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, handleSearch, itemsPerPage]);

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchTemplates(1);
  };

  const openViewDialog = (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };
  const openEditDialog = (record) => {
    console.log(record, 'record')
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };
  const closeViewDialog = () => {
    setSelectedRecord(null);
    setViewDialogOpen(false);
  };

  const closeEditDialog = () => {
    setSelectedRecord(null);
    setEditDialogOpen(false);
  };
  const handleSubmitSuccess = () => fetchTemplates(currentPage);
  const handlePageChange = (p) => setCurrentPage(p);

  // عرض نص مناسب لكل تبويب (واتساب: message) (إيميل: subject + body snippet)
  const renderPreview = (item) => {
    if (activeTab === "whatsapp") return item.message;
    const text = stripHtml(item.body || "").slice(0, 180);
    return (
      <>
        <div className="font-medium">{item.subject}</div>
        <div className="opacity-70">
          {text}
          {text.length === 180 ? "..." : ""}
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="flex justify-between mt-2">
        <PageTitle title={t("Templates")} />
        <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[220px]"
              value={search}
              placeholder={t("Search")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                refreshBtn && (
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
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <Select
              value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
              onChange={(selectedOption) => {
                setItemsPerPage(Number(selectedOption.value));
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
        </form>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
        <TabsList>
          <TabsTrigger value="whatsapp">{t("WhatsApp")}</TabsTrigger>
          <TabsTrigger value="email">{t("Email")}</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <TemplateTable
            loading={loading}
            templates={templates}
            links={links}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            canUpdate={canUpdateWhats}
            renderPreview={renderPreview}
            onEdit={openEditDialog}
            onView={openViewDialog}
          />
        </TabsContent>

        <TabsContent value="email">
          <TemplateTable
            loading={loading}
            templates={templates}
            links={links}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            canUpdate={canUpdateEmail}
            renderPreview={renderPreview}
            onEdit={openEditDialog}
            onView={openViewDialog}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs تختلف حسب التاب */}
      {viewDialogOpen &&
        (activeTab === "whatsapp" ? (
          <WhatsappView record={selectedRecord} onClose={closeViewDialog} />
        ) : // : <EmailView record={selectedRecord} onClose={closeViewDialog} />
          null)}
      {editDialogOpen &&
        (activeTab === "whatsapp" ?
          <TemplateEditDialog
            open={editDialogOpen}
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeEditDialog}
            channel="whatsapp"
          /> : (
            <TemplateEditDialog
              open={editDialogOpen}
              onSubmitSuccess={handleSubmitSuccess}
              record={selectedRecord}
              onClose={closeEditDialog}
              channel="email"
            />
          ))
      }
    </div>
  );
};

export default TemplateIndexTabs;

/* ===== Helpers / Small components ===== */
function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function TemplateTable({
  loading,
  templates,
  links,
  currentPage,
  onPageChange,
  canUpdate,
  renderPreview,
  onEdit,
  onView,
}) {
  const { t } = useTranslation();

  return (
    <div className="shadow-md py-4 mt-2 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead isFixed>{t("Name")}</TableHead>
            <TableHead>{t("Content")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                <Loader />
              </TableCell>
            </TableRow>
          ) : templates && templates.length > 0 ? (
            templates.map((template, idx) => (
              <TableRow key={idx}>
                <TableCell isFixed>
                  <div className="font-medium">{template.name}</div>
                  <div className="flex gap-x-2 mt-2 justify-center">
                    {canUpdate && (
                      <Button
                        variant="edit"
                        size="xs"
                        onClick={() => onEdit(template)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => onView(template)}
                      variant="show"
                      size="xs"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-wrap">
                  {renderPreview(template)}
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
        onPageChange={onPageChange}
      />
    </div>
  );
}
