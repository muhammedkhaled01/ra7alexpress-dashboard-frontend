import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageCircle, Phone } from "lucide-react";
import axiosMerchant from "@/axios";
import { toast } from "react-toastify";
import { handleError } from "@/utils/helpers";

function View({ record, onClose, fetchShipments, t }) {
  const [loadingStates, setLoadingStates] = useState({
    messagePhone: false,
    callPhone: false,
    alternateMessage: false,
    alternateCall: false,
  });
  console.log(record)
  const handleWhatsapp = async (shipment, e) => {
    e.preventDefault();
    let shipmentId = shipment.id;
    setLoadingStates((prev) => ({ ...prev, [shipmentId]: true }));
    try {
      const response = await axiosMerchant.post(`driver/shipments/sendWhatsappMessage`, {
        shipmentId: shipmentId,
      });

      const message = response.data.message;
      if (message) {
        let customerPhone = shipment?.consignee?.cellphone
          ? shipment?.consignee?.cellphone
          : shipment?.consignee?.alternatePhone;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/+968${customerPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank");
      }

      setLoadingStates((prev) => ({ ...prev, [shipmentId]: false }));
    } catch (error) {
      setLoadingStates((prev) => ({ ...prev, [shipmentId]: false }));
      console.error(`Error fetching template for shipment ${shipmentId}`, error);
    }
  };

  const handleCall = async (btnKey, e) => {
    e.preventDefault();
    setLoadingStates((prev) => ({ ...prev, [btnKey]: true }));

    try {
      const response = await axiosMerchant.post("/driver/shipments/contact_count", {
        shipment_id: record.id,
      });
      fetchShipments("signed");
      toast.success(response.data.message);
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [btnKey]: false }));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader id="no-print">
          <DialogTitle>Contact Customer</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="grid grid-cols-1 gap-4">
          <div>
            <ul className="grid gap-3">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Customer Name</span>
                <span>{record?.consignee?.name}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Called</span>
                <span>
                  {record?.shipment_delivery?.driver_call_count}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone number</span>
                <div className="space-x-2">
                  <Button onClick={(e) => handleWhatsapp(record, e)}>
                    {loadingStates.messagePhone ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle />
                    )}
                  </Button>

                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://wa.me/+968${record?.consignee?.cellphone}`}
                  >
                    <Button
                      disabled={loadingStates.callPhone}
                      onClick={(e) => handleCall("callPhone", e)}
                    >
                      {loadingStates.callPhone ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Phone />
                      )}
                    </Button>
                  </a>
                </div>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Another Phone no</span>
                <div className="space-x-2">
                  <Button onClick={(e) => handleWhatsapp(record, e)}>
                    {loadingStates.messagePhone ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle />
                    )}
                  </Button>

                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://wa.me/+968${record?.consignee?.alternatePhone}`}
                  >
                    <Button
                      disabled={loadingStates.alternateCall}
                      onClick={(e) => handleCall("alternateCall", e)}
                    >
                      {loadingStates.alternateCall ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Phone />
                      )}
                    </Button>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <Separator />
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default View;
