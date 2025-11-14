import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import DriverInvoicesPending from "./tabs/DriverInvoicesPending";
import DriverInvoicesCompleted from "./tabs/DriverInvoicesCompleted";
import { useNavigate } from "react-router-dom";
import { can } from "@/utils/helpers";

export default function DriverInvoiceTabs() {

    const { t } = useTranslation()
    const navigate = useNavigate()

    const canAccess = can("Invoice access")

    if (!canAccess) {
        return navigate("/unauthorized");
    }
    return (
        <Tabs defaultValue="pending">
            <TabsList>
                <TabsTrigger value="pending">{t("Pending")}</TabsTrigger>
                <TabsTrigger value="completed">{t("Completed")}</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                <DriverInvoicesPending />
            </TabsContent>
            <TabsContent value="completed">
                <DriverInvoicesCompleted />
            </TabsContent>
        </Tabs>
    );
}