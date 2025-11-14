import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Settings, Loader2, Loader } from "lucide-react"
import { toast } from "react-hot-toast";
import axiosMerchant from "@/axios"
import RequiredField from "@/components/misc/RequiredField"

export default function ShipperSettings() {
    const { t } = useTranslation()
    const [shipperCommission, setShipperCommission] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [errors, setErrors] = useState({
        shipperCommission: ''
    })

    const fetchDefaultCommission = async () => {
        setIsFetching(true);
        try {
            const response = await axiosMerchant.get('/shippers/default-commission');
            setShipperCommission(response.data.data.value.toString());
        } catch (error) {
            console.error('Error fetching default commission:', error);
        } finally {
            setIsFetching(false);
        }
    }

    const validateForm = () => {
        const newErrors = {
            shipperCommission: ''
        };

        if (!shipperCommission) {
            newErrors.shipperCommission = t('Shipper commission is required');
        } else if (isNaN(shipperCommission)) {
            newErrors.shipperCommission = t('Shipper commission must be a valid number');
        } else if (Number(shipperCommission) <= 0) {
            newErrors.shipperCommission = t('Shipper commission must be greater than 0');
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleConfirm = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await axiosMerchant.post('/shippers/update-default-commission', {
                value: shipperCommission
            });
            toast.success(t("Default shipper commission updated successfully"));
            setIsOpen(false);
        } catch (error) {
            toast.error(
                error.response?.data?.message || t("Failed to update default shipper commission")
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Button
                type="button"
                variant="settings"
                onClick={async () => {
                    setIsOpen(true);
                    await fetchDefaultCommission();
                }}
            >
                <Settings className="w-4 h-4" />
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("Shipper Settings")}</DialogTitle>
                        <DialogDescription>
                            {t("Configure shipper settings")}
                        </DialogDescription>
                    </DialogHeader>
                    {isFetching ? (
                        <div className="flex items-center justify-center h-[120px]">
                            <Loader className="!h-[30px] !w-[30px] animate-spin" />
                        </div>
                    ) : (
                        <div className="py-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block mb-2">
                                        {t("Default Shipper Commission")} <RequiredField />
                                    </label>
                                    <Input
                                        type="number"
                                        value={shipperCommission}
                                        onChange={(e) => setShipperCommission(e.target.value)}
                                        placeholder={t("Enter Default Shipper Commission")}
                                        error={errors.shipperCommission}
                                    />
                                    {errors.shipperCommission && (
                                        <p className="mt-1 text-sm text-red-500">{errors.shipperCommission}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={handleConfirm}
                            type="button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("Saving")}
                                </>
                            ) : (
                                t("Save")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
