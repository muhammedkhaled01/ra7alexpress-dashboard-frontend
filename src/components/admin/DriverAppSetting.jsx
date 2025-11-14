import axiosMerchant from "@/axios";

import { getSetting } from "@/stores/features/settingFeature";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageTitle from "./Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { can, handleError, isAuthorized } from "@/utils/helpers";
import ImagePreview from "../misc/ImagePreview";
import { useNavigate } from "react-router-dom";

function DriverAppSetting() {
    const [loading, setLoading] = useState({});
    const [settings, setSettings] = useState([])
    const { t } = useTranslation()

    useEffect(() => {
        fetchSettings()
    }, [])

    const updateSetting = async (e) => {
        e.preventDefault()
        setLoading({ submitBtn: true })
        const form = new FormData(e.currentTarget)
        try {
            const response = await axiosMerchant.post("driver_app_settings/update", form)
            console.log(response.data)
            toast.success(response.data.message)
            await fetchSettings()
        } catch (error) {
            handleError(error)
        } finally {
            setLoading({ submitBtn: false })
        }
    }

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const response = await axiosMerchant.get(`driver_app_settings`);
            setSettings(response.data.data)
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const navigate = useNavigate()

    const canAccess = can("Driver App Setting access")

    if (!canAccess) {
        return navigate("/unauthorized");
    }

    return (
        <>
            <PageTitle title={t("Driver Application Setting")} /><br />
            <div className="shadow-md p-4 rounded-lg">
                {/* <h2 className="text-lg font-bold mb-2">{t("Update Driver Application Setting")}</h2> */}
                <form onSubmit={updateSetting}>
                    <div className="mt-3 mb-3">
                        <Label htmlFor="Main Screen Image">{t("Main Screen Image")}</Label>
                        <Input name="main_screen_image" type="file" />
                    </div>
                    <ImagePreview className="" src={settings?.main_screen_image} />
                    <Button type="submit" className="mt-2 ml-2" disabled={loading.submitBtn}>
                        {loading.submitBtn ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            t("Save Changes")
                        )}
                    </Button>
                </form>
            </div>
        </>
    );
}


export default DriverAppSetting;