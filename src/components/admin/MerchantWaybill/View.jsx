import React, { useEffect, useState, useCallback } from "react";
import {useParams, useNavigate, useSearchParams} from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";

import PageTitle from "../Layouts/PageTitle";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import Pagination from "@/components/Pagination";
import { Button } from "../../ui/button";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {Eye, RefreshCcw} from "lucide-react";
import { can, handleError, hasRole } from "@/utils/helpers";
import RequestWaybillButton from "@/components/RequestWaybillButton";

const MerchantWaybillView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { merchant_id } = useParams();
  const [searchParams] = useSearchParams();
  const batch_id = searchParams.get('batch_id');

  const accessAbility = can("Merchant Waybill access");

  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState(""); // احتياطي لو حبيت تضيف سيرش لاحقًا (مش مستخدم في API حاليًا)

  // تحميل الـ batches
  const fetchBatches = useCallback(
    async (pageNumber) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("page", pageNumber);
        qs.set("per_page", itemsPerPage);
        if (merchant_id) qs.set("merchant_id", merchant_id);

        const res = await axiosMerchant.get(
          `/merchant_waybills/batches?${qs.toString()}`
        );
        const payload = res.data?.data;
        setLinks(payload?.links || []);
        setBatches(payload?.data || []);
      } catch (e) {
        handleError(e);
      } finally {
        setLoading(false);
      }
    },
    [merchant_id, itemsPerPage]
  );

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    fetchBatches(currentPage);
  }, [accessAbility, fetchBatches, currentPage, navigate]);

  const handleRefresh = () => {
    setSearch("");
    fetchBatches(currentPage);
  };

  const canRequest = hasRole("Merchant") || hasRole("Merchant Admin");

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        <PageTitle title={t("Merchant Waybill Batches")} />
        <div className="flex items-center gap-2">
          <form className="flex justify-end w-full md:w-auto">
            <div className="flex flex-col md:flex-row md:gap-x-2 w-full">
              {/*<Input*/}
              {/*  name="search"*/}
              {/*  type="text"*/}
              {/*  className="w-full md:w-[240px]"*/}
              {/*  value={search}*/}
              {/*  onChange={(e) => setSearch(e.target.value)}*/}
              {/*  placeholder={t("Search (not active)")}*/}
              {/*  icon={*/}
              {/*    <RefreshCcw*/}
              {/*      className="w-4 h-4 cursor-pointer"*/}
              {/*      onClick={handleRefresh}*/}
              {/*    />*/}
              {/*  }*/}
              {/*/>*/}
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
              value={{ value: itemsPerPage, label: String(itemsPerPage) }}
              onChange={(opt) => setItemsPerPage(Number(opt.value))}
              options={[5, 8, 15, 25, 50, 100].map((n) => ({
                value: n,
                label: String(n),
              }))}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      {canRequest && (
        <RequestWaybillButton
          onSuccess={() => fetchBatches(1)}
          className="bg-primary hover:bg-primary/90 text-white mt-3"
        />
      )}

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("#")}</TableHead>
                <TableHead>{t("User Waybills")}</TableHead>
                <TableHead>{t("Created At")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : batches.length > 0 ? (
              batches.map((b, idx) => {
                const total = b.waybills_count ?? 0;
                const used = b.used_count ?? 0;

                return (
                  <TableRow key={b.id}>
                    <TableCell>{(links?.from ?? 1) + idx}</TableCell>
                      <TableCell className="text-center">
                          <Badge variant="delivered">{used}/{total}</Badge>
                      </TableCell>
                    <TableCell>
                      {b.created_at
                        ? new Date(b.created_at).toLocaleString()
                        : "-"}
                    </TableCell>
                      <TableCell className="flex justify-center items-center">
                          <div onClick={() => navigate(`/merchant/${merchant_id}/${b.id}/view-batch-waybill`)} className={" bg-gray-300 rounded-lg size-[30px] flex justify-center items-center"}>
                              <Eye className="w-4 h-4 cursor-pointer text-primary hover:text-primary/90"/>
                          </div>
                      </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination links={links} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default MerchantWaybillView;
