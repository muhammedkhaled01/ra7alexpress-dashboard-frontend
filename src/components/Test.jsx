
import { getBranches, getFacilities, getHubs, getStations } from '@/stores/features/ajaxFeature'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const Test = () => {
    const facilities = useSelector(store => store.ajax.facilities)
    const branches = useSelector(store => store.ajax.branches)
    const stations = useSelector(store => store.ajax.stations)
    const hubs = useSelector(store => store.ajax.hubs)

    const dispatch = useDispatch();

    useEffect(() => {
        if (!facilities) dispatch(getFacilities())
        if (!branches) dispatch(getBranches())
        if (!stations) dispatch(getStations())
        if (!hubs) dispatch(getHubs())
    }, [])

    return (
        <div>
            <div>
                <label htmlFor="destination_type">{t("Destination Type")}</label>
                <Select
                    name="destination_type"
                    options={facilities?.map((facility) => ({ value: facility.value, label: facility.label }))}
                />
            </div>
            <div>
                <label htmlFor="destination_id">{t("Destination")}</label>
                <Select
                    name="destination_id"
                    options={}
                    className="basic-multi-select"
                    classNamePrefix="select"
                />
            </div>
        </div>
    )
}

export default Test