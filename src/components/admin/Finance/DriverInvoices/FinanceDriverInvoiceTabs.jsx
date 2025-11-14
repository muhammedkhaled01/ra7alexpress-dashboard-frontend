import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import FinanceDriverInvoicePending from "./FinanceDriverInvoicePending";
import FinanceDriverInvoiceCompleted from "./FinanceDriverInvoiceCompleted";

export default function FinanceDriverInvoiceTabs() {

    const { t } = useTranslation()

    return (
        <Tabs defaultValue="pending">
            <TabsList>
                <TabsTrigger value="pending">{t("Pending")}</TabsTrigger>
                <TabsTrigger value="completed">{t("Completed")}</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                <FinanceDriverInvoicePending />
            </TabsContent>
            <TabsContent value="completed">
                <FinanceDriverInvoiceCompleted />
            </TabsContent>
        </Tabs>
    );
}
