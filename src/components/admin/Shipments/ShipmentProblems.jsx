import React, { useEffect, useState, useCallback } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import PageTitle from "../Layouts/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";
import moment from "@/utils/moment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/Pagination";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import ImagePreview from "@/components/misc/ImagePreview";
import { RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { can, handleError } from "@/utils/helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Select from "@/components/misc/Select";
import NDRView from "@/components/admin/Shipments/NDRView";

function NDRList() {
  const { t } = useTranslation();

  // Permissions
  const canAccessProblems = can("Problems access");
  if(!canAccessProblems) return null;
  // DEBUGGING
  console.log("Can Access: "+canAccessProblems)

  // table state
  const [rows, setRows] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // unified filters
  const today = moment().format("YYYY-MM-DD");
  const [filters, setFilters] = useState({
    query: "",
    status: null,
    driver_id: null,
    company_id: null,
    workspace_key: null,
    workspace_type: null,
    exception_type: null,
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
  });

  // dropdown data
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [exceptionTypes, setExceptionTypes] = useState([]);

  // controlled Select values
  const [driverValue, setDriverValue] = useState(null);
  const [companyValue, setCompanyValue] = useState(null);
  const [workspaceValue, setWorkspaceValue] = useState(null);
  const [exceptionValue, setExceptionValue] = useState(null);
  const [statusValue, setStatusValue] = useState(null);

  // Get user workspaces from Redux
  const authUser = useSelector((store) => store.auth.user);

  // utils for options - محسّنة للتعامل مع structures مختلفة
  const extractArray = (res) => {
    // Try different response structures
    if (Array.isArray(res?.data?.data?.data)) return res.data.data.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  };

  const mapCompany = (x) => {
    if (!x) return null;
    return {
      label: x?.name || x?.company_name || `Company #${x?.id}`,
      value: x?.id,
    };
  };

  const mapWorkspace = (x) => {
    if (!x) return null;
    const typeName = String(x?.type || "")
      .split("\\")
      .pop();
    return {
      label: `${x?.name || `Workspace #${x?.id}`} ${
        typeName ? `(${typeName})` : ""
      }`,
      value: x?.id,
      type: x?.type,
    };
  };

  const mapDriver = (x) => {
    if (!x) return null;
    return {
      label:
        x?.name ||
        x?.driver_name ||
        x?.user?.name ||
        x?.employee?.name ||
        x?.full_name ||
        `Driver #${x?.id}`,
      value: x?.id,
    };
  };

  const mapException = (x) => {
    if (!x) return null;
    // Handle if it's already a string
    if (typeof x === "string") {
      return { label: x, value: x };
    }
    return {
      label: x?.label || x?.name || x?.type || x?.value || String(x),
      value: x?.value || x?.name || x?.type || x?.code || x?.key || String(x),
    };
  };

  // Load dropdown options
  useEffect(() => {
    (async () => {
      try {
        // Fetch drivers
        const driversRes = await axiosMerchant.get("/drivers/all");
        const driversData = extractArray(driversRes);
        console.log("Drivers raw:", driversData);
        setDrivers(driversData.map(mapDriver).filter(Boolean));

        // Fetch companies
        const companiesRes = await axiosMerchant.get("/companies/all");
        const companiesData = extractArray(companiesRes);
        console.log("Companies raw:", companiesData);
        setCompanies(companiesData.map(mapCompany).filter(Boolean));

        const workspaceData = authUser?.workspaces || [];
        console.log("Workspaces raw:", workspaceData);
        setWorkspaces(workspaceData.map(mapWorkspace).filter(Boolean));

        // Fetch exception types
        const exceptionsRes = await axiosMerchant.get("/delivery_exceptions/all ");
        const exceptionsData = extractArray(exceptionsRes);
        console.log("Exceptions raw:", exceptionsData);
        setExceptionTypes(exceptionsData.map(mapException).filter(Boolean));
      } catch (error) {
        console.error("Error loading filters:", error);
        toast.error(t("Error loading filter options"));
      }
    })();
  }, [t, authUser]);

  // fetch list - الآن بيعتمد على filters بشكل صحيح
  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchingData(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, v]) => v !== null && v !== undefined && v !== ""
        )
      );

      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(itemsPerPage),
        ...Object.entries(activeFilters).reduce((acc, [k, v]) => {
          acc[k] = String(v);
          return acc;
        }, {}),
      });

      const res = await axiosMerchant.get(
        `/shipments/not_deliver?${params.toString()}`
      );

      const payload = res?.data?.data ?? {};
      const data = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      const navLinks = Array.isArray(payload?.links)
        ? payload.links
        : payload?.meta?.links ?? [];

      setRows(data);
      setLinks(navLinks);
      setLoading(false);
    } catch (error) {
      toast.error(t("Error fetching list"));
      handleError(error);
      setLoading(false);
    } finally {
      setFetchingData(false);
    }
  }, [filters, currentPage, itemsPerPage, t]);

  const getNoAnswerCount = (row) => {
    if (typeof row?.no_answer_count === "number") return row.no_answer_count;
    if (Array.isArray(row?.shipmentHistories)) {
      return row.shipmentHistories.filter((h) => {
        const k = (h?.type || h?.name || "").toString().toUpperCase();
        return k === "NO_ANSWER";
      }).length;
    }
    return undefined;
  };

  // هيشتغل تلقائياً لما filters يتغير
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleRefresh = () => {
    setCurrentPage(1);
    setItemsPerPage(10);
    setDriverValue(null);
    setCompanyValue(null);
    setWorkspaceValue(null);
    setExceptionValue(null);
    setStatusValue(null);
    const today = moment().format("YYYY-MM-DD");
    setFilters({
      query: "",
      status: null,
      driver_id: null,
      company_id: null,
      workspace_key: null,
      workspace_type: null,
      exception_type: null,
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
    });
  };

  // actions (reschedule)
  const [reschOpen, setReschOpen] = useState(false);
  const [reschRow, setReschRow] = useState(null);
  const [reschAt, setReschAt] = useState(
    moment().add(1, "hour").format("YYYY-MM-DDTHH:mm")
  );
  const [reschNotes, setReschNotes] = useState("");

  const openReschedule = (row) => {
    setReschRow(row);
    setReschAt(moment().add(1, "hour").format("YYYY-MM-DDTHH:mm"));
    setReschNotes("");
    setReschOpen(true);
  };

  const submitReschedule = async () => {
    try {
      if (!reschRow) return;

      const m = moment(reschAt);
      if (!m.isValid()) {
        toast.error(t("Please choose a valid date & time"));
        return;
      }
      if (m.isBefore(moment())) {
        toast.error(t("Reschedule date must be in the future"));
        return;
      }

      await axiosMerchant.post("/shipments/ndr/reschedule", {
        id: reschRow.id,
        reschedule_date: m.format("YYYY-MM-DD"),
        reschedule_time: m.format("HH:mm"),
        notes: reschNotes || undefined,
      });

      toast.success(t("Rescheduled"));
      setReschOpen(false);
      setReschRow(null);
      fetchData();
    } catch (err) {
      handleError(err);
    }
  };

  // helper: badge style by status
  const badgeVariant = (status) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "Rescheduled":
        return "outline";
      case "Closed":
        return "default";
      case "Delivered":
        return "success";
      case "RTO":
        return "destructive";
      default:
        return "outline";
    }
  };

  // View Dialog State & handlers
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const openView = (row) => {
    setViewRow(row);
    setViewOpen(true);
  };

  return (
    <div className="p-4">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="mt-2">
          <CardTitle>
            <PageTitle title={t("Non-Delivery Reports")} />
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* FILTER BAR */}
          <div className="flex flex-wrap items-end gap-4 mt-2">
            <div className="w-[260px]">
              <label className="mb-1 block">{t("Search / Query")}</label>
              <Input
                placeholder={t("Search by ID, customer, address…")}
                value={filters.query}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, query: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1">{t("Date & Time Range")}</label>
              <DateTimeRangePicker
                filters={filters}
                onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
                t={t}
              />
            </div>

            <div className="w-[220px]">
              <label className="mb-1 block">{t("Status")}</label>
              <Select
                placeholder={t("All Status")}
                value={statusValue}
                onChange={(opt) => {
                  setStatusValue(opt);
                  setFilters((prev) => ({
                    ...prev,
                    status: opt ? opt.value : null,
                  }));
                  setCurrentPage(1);
                }}
                isClearable
                options={[
                  { value: "Pending", label: t("Pending") },
                  { value: "Rescheduled", label: t("Rescheduled") },
                  { value: "RTO", label: t("RTO") },
                  { value: "Delivered", label: t("Delivered") },
                ]}
              />
            </div>

            <div className="w-[220px]">
              <label className="mb-1 block">{t("Driver")}</label>
              <Select
                placeholder={t("All Drivers")}
                options={drivers}
                value={driverValue}
                onChange={(opt) => {
                  setDriverValue(opt);
                  setFilters((prev) => ({
                    ...prev,
                    driver_id: opt ? opt.value : null,
                  }));
                  setCurrentPage(1);
                }}
                isClearable
              />
            </div>

            <div className="w-[220px]">
              <label className="mb-1 block">{t("Company")}</label>
              <Select
                placeholder={t("All Companies")}
                options={companies}
                value={companyValue}
                onChange={(opt) => {
                  setCompanyValue(opt);
                  setFilters((prev) => ({
                    ...prev,
                    company_id: opt ? opt.value : null,
                  }));
                  setCurrentPage(1);
                }}
                isClearable
              />
            </div>

            <div className="w-[220px]">
              <label className="mb-1 block">{t("Workspace")}</label>
              <Select
                placeholder={t("All Workspaces")}
                options={workspaces}
                value={workspaceValue}
                onChange={(opt) => {
                  setWorkspaceValue(opt);
                  setFilters((prev) => ({
                    ...prev,
                    workspace_key: opt ? opt.value : null,
                    workspace_type: opt ? opt.type : null,
                  }));
                  setCurrentPage(1);
                }}
                isClearable
              />
            </div>

            <div className="w-[240px]">
              <label className="mb-1 block">{t("Exception Type")}</label>
              <Select
                placeholder={t("All Exceptions")}
                options={exceptionTypes}
                value={exceptionValue}
                onChange={(opt) => {
                  setExceptionValue(opt);
                  setFilters((prev) => ({
                    ...prev,
                    exception_type: opt ? opt.value : null,
                  }));
                  setCurrentPage(1);
                }}
                isClearable
              />
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-muted-foreground">
                  {t("Show")}
                </label>
                <Select
                  value={{
                    value: itemsPerPage,
                    label: itemsPerPage.toString(),
                  }}
                  onChange={(opt) => setItemsPerPage(Number(opt?.value ?? 10))}
                  options={[
                    { value: 5, label: "5" },
                    { value: 10, label: "10" },
                    { value: 15, label: "15" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" },
                  ]}
                  className="w-20 text-sm"
                  isSearchable={false}
                />
              </div>
              <Button
                type="button"
                variant="refresh"
                onClick={handleRefresh}
                className="h-9 px-3"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* TABLE */}
          <Table className="text-xs mt-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>{t("Receipt")}</TableHead>
                <TableHead>{t("NDR ID")}</TableHead>
                <TableHead>{t("Shipment")}</TableHead>
                <TableHead>{t("Customer")}</TableHead>
                <TableHead>{t("Address")}</TableHead>
                <TableHead>{t("Contact")}</TableHead>
                <TableHead>{t("Driver")}</TableHead>
                <TableHead>{t("Company")}</TableHead>
                <TableHead>{t("Workspace")}</TableHead>
                <TableHead>{t("Exception Type")}</TableHead>
                <TableHead>{t("Attempt Date")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading || fetchingData ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center">
                    <Loader />
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </TableCell>
                    <TableCell>
                      {r.in_exception && r.core_exception?.proof ? (
                        <ImagePreview
                          style={{ width: 60, height: 60 }}
                          src={r.core_exception.proof}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{r.core_exception?.id ?? "—"}</TableCell>
                    <TableCell>{r.tracking_no}</TableCell>
                    <TableCell>
                      {r.consignee?.name || r.merchant?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {r.address ?? r.consignee?.address ?? "—"}
                    </TableCell>
                    <TableCell>{r.consignee?.phone || "—"}</TableCell>
                    <TableCell>{r.driver?.name || "—"}</TableCell>
                    <TableCell>
                      {r.company?.name || r.merchant?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {r.warehouse?.name ||
                        r.workspace?.name ||
                        r.core_exception?.warehouse?.name ||
                        r.core_exception?.workspace?.name ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      {r.core_exception?.type || "—"}
                      {String(r.core_exception?.type || "").toUpperCase() ===
                        "NO_ANSWER" &&
                        (() => {
                          const c = getNoAnswerCount(r);
                          return typeof c === "number" && c > 0 ? (
                            <Badge variant="secondary" className="ml-2">
                              ×{c}
                            </Badge>
                          ) : null;
                        })()}
                    </TableCell>
                    <TableCell>
                      {r.core_exception?.time ||
                        r.core_exception?.updated_at ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(r.ndr_status)}>
                        {r.ndr_status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openView(r)}
                      >
                        {t("View")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={15}>
                    <NoRecordFound />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4">
            <Pagination
              links={links}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>

          {/* Reschedule Dialog */}
          <Dialog open={reschOpen} onOpenChange={setReschOpen}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>{t("Reschedule")}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t("Shipment")}</div>
                    <div className="font-medium">
                      {reschRow?.tracking_no ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {t("Exception Type")}
                    </div>
                    <div className="font-medium">
                      {reschRow?.core_exception?.type ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="resch-dt">{t("New Date & Time")}</Label>
                  <Input
                    id="resch-dt"
                    type="datetime-local"
                    value={reschAt}
                    onChange={(e) => setReschAt(e.target.value)}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground">
                    {t("Must be in the future")}
                  </span>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="resch-notes">{t("Notes (optional)")}</Label>
                  <Input
                    id="resch-notes"
                    value={reschNotes}
                    onChange={(e) => setReschNotes(e.target.value)}
                    placeholder={t("Add any dispatcher notes")}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setReschOpen(false)}>
                  {t("Cancel")}
                </Button>
                <Button onClick={submitReschedule}>{t("Confirm")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <NDRView
            open={viewOpen}
            onOpenChange={(o) => {
              setViewOpen(o);
              if (!o) setViewRow(null);
            }}
            row={viewRow}
            onReschedule={(row) => {
              setReschRow(row);
              setReschAt(moment().add(1, "hour").format("YYYY-MM-DDTHH:mm"));
              setReschNotes("");
              setReschOpen(true);
              setViewOpen(false);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default NDRList;
