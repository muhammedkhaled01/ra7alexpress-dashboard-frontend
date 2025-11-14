import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Settings, Loader2, Loader } from "lucide-react"
import { toast } from "react-hot-toast";
import axiosMerchant from "@/axios"
import RequiredField from "@/components/misc/RequiredField"

export default function DriverSettings() {
    const { t } = useTranslation()
    const [deliveryBonuse, setDeliveryBonuse] = useState("")
    const [pickupBonuse, setPickupBonuse] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [errors, setErrors] = useState({
        deliveryBonuse: '',
        pickupBonuse: ''
    })

    const fetchDefaultBonuses = async () => {
        setIsFetching(true);
        try {
            const response = await axiosMerchant.get('/drivers/default-bonuse');
            setDeliveryBonuse(response.data.data.delivery.value.toString());
            setPickupBonuse(response.data.data.pickup.value.toString());
        } catch (error) {
            console.error('Error fetching default bonuses:', error);
        } finally {
            setIsFetching(false);
        }
    }

    const validateForm = () => {
        const newErrors = {
            deliveryBonuse: '',
            pickupBonuse: ''
        };

        if (!deliveryBonuse) {
            newErrors.deliveryBonuse = t('Delivery bonuse is required');
        } else if (isNaN(deliveryBonuse)) {
            newErrors.deliveryBonuse = t('Delivery bonuse must be a valid number');
        } else if (Number(deliveryBonuse) <= 0) {
            newErrors.deliveryBonuse = t('Delivery bonuse must be greater than 0');
        }
        if (!pickupBonuse) {
            newErrors.pickupBonuse = t('Pickup bonuse is required');
        } else if (isNaN(pickupBonuse)) {
            newErrors.pickupBonuse = t('Pickup bonuse must be a valid number');
        } else if (Number(pickupBonuse) <= 0) {
            newErrors.pickupBonuse = t('Pickup bonuse must be greater than 0');
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleConfirm = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await axiosMerchant.post('/drivers/update-default-bonuse', {
                delivery_value: deliveryBonuse,
                pickup_value: pickupBonuse
            });
            toast.success(t("Driver bonuses updated successfully"));
            setIsOpen(false);
        } catch (error) {
            toast.error(
                error.response?.data?.message || t("Failed to update driver bonuses")
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
                    await fetchDefaultBonuses();
                }}
            >
                <Settings className="w-4 h-4" />
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("Driver Settings")}</DialogTitle>
                        <DialogDescription>
                            {t("Configure driver settings")}
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
                                        {t("Default Delivery Bonuse")} <RequiredField />
                                    </label>
                                    <Input
                                        type="number"
                                        value={deliveryBonuse}
                                        onChange={(e) => setDeliveryBonuse(e.target.value)}
                                        placeholder={t("Enter Default Delivery Bonuse")}
                                        error={errors.deliveryBonuse}
                                    />
                                    {errors.deliveryBonuse && (
                                        <p className="mt-1 text-sm text-red-500">{errors.deliveryBonuse}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="block mb-2">
                                        {t("Default Pickup Bonuse")} <RequiredField />
                                    </label>
                                    <Input
                                        type="number"
                                        value={pickupBonuse}
                                        onChange={(e) => setPickupBonuse(e.target.value)}
                                        placeholder={t("Enter Default Pickup Bonuse")}
                                        error={errors.pickupBonuse}
                                    />
                                    {errors.pickupBonuse && (
                                        <p className="mt-1 text-sm text-red-500">{errors.pickupBonuse}</p>
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
