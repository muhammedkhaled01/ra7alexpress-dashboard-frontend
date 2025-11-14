function getOperationHubNameByShipmentHistoryName(name, shipmentHistories) {
    if (!name || typeof name !== "string") return null;
    if (!shipmentHistories || !Array.isArray(shipmentHistories)) return null;
    const history = shipmentHistories.find(
        (h) => String(h?.name).toLowerCase() === String(name).toLowerCase()
    );
    return history?.operation_hub_name ?? null;
}

function getHubInformationByShipmentStatus(status, shipmentHistories) {
    const data = { from: null, current: null, to: null };
    if (!status || typeof status !== "string") return data;
    if (!shipmentHistories || !Array.isArray(shipmentHistories)) return data;

    const statusHubs = {
        created: getOperationHubNameByShipmentHistoryName("CREATED", shipmentHistories),
        dispatched: getOperationHubNameByShipmentHistoryName("DISPATCH", shipmentHistories),
        ofd: getOperationHubNameByShipmentHistoryName("OFD", shipmentHistories),
        delivery_exception: getOperationHubNameByShipmentHistoryName("DELIVERY_EXCEPTION", shipmentHistories),
        delivered: getOperationHubNameByShipmentHistoryName("DELIVERED", shipmentHistories),
        sorted: getOperationHubNameByShipmentHistoryName("SORT", shipmentHistories),
        assignedToShelf: getOperationHubNameByShipmentHistoryName("ASSIGNED_TO_SHELF", shipmentHistories),
        waitingCRM: getOperationHubNameByShipmentHistoryName("WAITING_CRM", shipmentHistories),
        loaded: getOperationHubNameByShipmentHistoryName("LOADED", shipmentHistories),
        unloaded: getOperationHubNameByShipmentHistoryName("UNLOADED", shipmentHistories),
        moveToDispatch: getOperationHubNameByShipmentHistoryName("MOVE_TO_DISPATCH", shipmentHistories)
    };

    const { created, sorted, moveToDispatch, delivered, delivery_exception, ofd, dispatched, assignedToShelf, waitingCRM, loaded, unloaded } = statusHubs;

    const statusHandlers = {
        SORT: () => {
            if (created === sorted) {
                data.current = sorted ?? created;
            } else {
                data.from = created;
                data.current = sorted;
            }
        },
        ASSIGNED_TO_SHELF: () => {
            if (created === assignedToShelf) {
                data.current = assignedToShelf ?? created;
            } else {
                data.from = created;
                data.current = assignedToShelf;
            }
        },
        WAITING_CRM: () => {
            if (created === waitingCRM) {
                data.current = waitingCRM ?? created;
            } else {
                data.from = created;
                data.current = waitingCRM;
            }
        },
        DELIVERED: () => {
            if (delivered === sorted) {
                data.current = sorted ?? delivered;
            } else {
                data.from = sorted;
                data.current = delivered;
            }
        },
        DELIVERY_EXCEPTION: () => {
            if (delivery_exception === sorted) {
                data.current = sorted ?? delivery_exception;
            } else {
                data.from = sorted;
                data.current = delivery_exception;
            }
        },
        OFD: () => {
            if (ofd === sorted) {
                data.current = sorted ?? ofd;
            } else {
                data.from = sorted;
                data.current = ofd;
            }
        },
        DISPATCH: () => {
            if (dispatched === sorted) {
                data.current = sorted ?? dispatched;
            } else {
                data.from = sorted;
                data.current = dispatched;
            }
        },
        MOVE_TO_DISPATCH: () => {
            data.from = loaded && unloaded ? loaded : created;
            data.current = loaded && unloaded ? unloaded : moveToDispatch;
        },
        MOVE_TO_AREA: () => {
            data.from = loaded;
            data.current = unloaded;
        },
        LOADED: () => {
            data.from = created === sorted ? null : created;
            data.current = unloaded ? unloaded : created;
        }
    };

    const handler = statusHandlers[status];
    if (handler) handler();

    return data;
}

export { getOperationHubNameByShipmentHistoryName, getHubInformationByShipmentStatus };