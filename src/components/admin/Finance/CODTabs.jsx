import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import CODCollectionPending from "./CODCollectionPending";
import CODCollectionCompleted from "./CODCollectionCompleted";
import CODCollectionHolding from "./CODCollectionHolding";

import { useTranslation } from "react-i18next";

export default function CODTabs() {
    const { t } = useTranslation()

    return (
        <div>
            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">{t("To Confirm")}</TabsTrigger>
                    <TabsTrigger value="holding">{t("Holding")}</TabsTrigger>
                    <TabsTrigger value="completed">{t("Completed")}</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    <CODCollectionPending />
                </TabsContent>
                <TabsContent value="holding">
                    <CODCollectionHolding />
                </TabsContent>
                <TabsContent value="completed">
                    <CODCollectionCompleted />
                </TabsContent>
            </Tabs>
        </div>
    );
}
