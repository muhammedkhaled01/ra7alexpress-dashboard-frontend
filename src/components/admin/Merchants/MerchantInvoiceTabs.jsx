import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import MerchantInvoicesPending from "./tabs/InvoicesPending";
import MerchantInvoicesCompleted from "./tabs/InvoicesCompleted";

export default function MerchantInvoiceTabs() {

    const { t } = useTranslation()

    return (
        <Tabs defaultValue="pending">
            <TabsList>
                <TabsTrigger value="pending">{t("Pending")}</TabsTrigger>
                <TabsTrigger value="completed">{t("Completed")}</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                <MerchantInvoicesPending />
            </TabsContent>
            <TabsContent value="completed">
                <MerchantInvoicesCompleted />
            </TabsContent>
        </Tabs>
    );
}
