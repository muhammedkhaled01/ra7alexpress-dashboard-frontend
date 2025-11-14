import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import PartnerAccounts from "./PartnerAccounts";
import PartnerWebhooks from "./PartnerWebhooks";

export default function PartnersTabs() {
    const { t } = useTranslation();

    return (
        <div>
            <Tabs defaultValue="accounts">
                <TabsList>
                    <TabsTrigger value="accounts">{t("Accounts")}</TabsTrigger>
                    <TabsTrigger value="webhooks">{t("Webhooks")}</TabsTrigger>
                </TabsList>
                <TabsContent value="accounts">
                    <PartnerAccounts />
                </TabsContent>
                <TabsContent value="webhooks">
                    <PartnerWebhooks />
                </TabsContent>
            </Tabs>
        </div>
    );
}

