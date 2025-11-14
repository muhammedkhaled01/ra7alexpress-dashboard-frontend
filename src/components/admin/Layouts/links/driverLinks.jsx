import { hasRole } from "@/utils/helpers";
import {
    Clipboard,
    Home,
    Package,
} from "lucide-react";

export function getDriverLinks(t) {
    return [
        {
            label: "Main",
            icon: Home,
            items: [
                {
                    label: t("My Shipments"),
                    path: "/my-shipments",
                    icon: Package,
                    permission: hasRole("Driver"),
                },
                {
                    label: t("My Pickup Task"),
                    path: "/my-pickup-task",
                    icon: Clipboard,
                    permission: hasRole("Driver"),
                },
            ],
        }
    ]
}



