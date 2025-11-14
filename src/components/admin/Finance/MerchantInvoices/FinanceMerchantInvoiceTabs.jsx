import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import FinanceMerchantInvoicePending from "./FinanceMerchantInvoicePending";
import FinanceMerchantInvoiceCompleted from "./FinanceMerchantInvoiceCompleted";
import { useNavigate } from "react-router-dom";
import { can } from "@/utils/helpers";

export default function FinanceMerchantInvoiceTabs() {

    const { t } = useTranslation()

    const navigate = useNavigate()

    const canAccess = can("Account access")

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
                <FinanceMerchantInvoicePending />
            </TabsContent>
            <TabsContent value="completed">
                <FinanceMerchantInvoiceCompleted />
            </TabsContent>
        </Tabs>
    );
}
