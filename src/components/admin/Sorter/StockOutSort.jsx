import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Loader from "@/components/Loader";
import { can, handleError, isAuthorized } from "@/utils/helpers";
import toast from "react-hot-toast";
import Select from "@/components/misc/Select"
import { useNavigate } from "react-router-dom";

function StockOutSort() {
    const [data, setData] = useState(null);
    const [trackingNo, setTrackingNo] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [task, setTask] = useState(null)
    const [tasks, setTasks] = useState(null)
    const { t } = useTranslation();

    const handleSort = async (e) => {
        e.preventDefault();
        if (!trackingNo || trackingNo.trim() === "") {
            toast.error(t("Please insert a tracking no"));
            return;
        }
        setLoading(true);
        setRefreshBtn(true);
        try {
            const response = await axiosMerchant.post(`sorter/stockout`, {
                stock_out_task_id: task.value,
                tracking_no: trackingNo,
            });
            setData(response.data);
            console.log(response);
        } catch (error) {
            handleError(error);
        } finally {
            setTrackingNo("");
            setLoading(false);
            document.getElementById("trackingNo")?.focus();
        }
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(`stockout_tasks/tasks`);
            setTasks(response.data.data)
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const handleRefresh = () => {
        setTask(null);
        setTasks(null);
        setTrackingNo("");
        setRefreshBtn(false);
        fetchTasks()
    };

    const navigate = useNavigate()

    const canAccess = can("StockOutTask access")

    if (!canAccess) {
        return navigate("/unauthorized");
    }

    return (
        <div>
            <PageTitle title={`${t("Stock Out")} ${task ? `| Task: ${task.label}` : ``}`} />
            <div className="flex flex-col space-y-4 mt-2">
                <div className="flex flex-col md:flex-row w-full md:space-x-4 space-y-2 md:space-y-0">
                    <form
                        className="flex w-full items-center space-x-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSort(e);
                        }}
                    >
                        {!task &&
                            <div className="w-full">
                                <Select
                                    name="transfer_task_id"
                                    value={task}
                                    onChange={(e) => {
                                        setRefreshBtn(true)
                                        setTask(e)
                                    }}
                                    options={tasks?.map((task) => ({
                                        value: task.id,
                                        label: `Task #${task.id} ${new Date(task.created_at).toLocaleString()}`,
                                    }))}
                                    className="w-full"
                                    placeholder={t("Select Task")}
                                    required
                                />
                            </div>
                        }
                        {task &&
                            <Input
                                type="text"
                                id="trackingNo"
                                placeholder={t("Tracking no")}
                                value={trackingNo}
                                onChange={(e) => setTrackingNo(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSort(e);
                                    }
                                }}
                                className="flex-grow"
                            />}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </form>

                    {refreshBtn && (
                        <Button type="button" variant="reset" onClick={handleRefresh}>
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <hr />
                {data ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t(`Shipment Details`)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl justify-self-center">{`${data.message}`}</p>
                            <br />
                            <br />
                        </CardContent>
                    </Card>
                ) : (
                    <p>{loading ? <Loader /> : t("No shipment found.")}</p>
                )}
            </div>
        </div>
    );
}

export default StockOutSort;
