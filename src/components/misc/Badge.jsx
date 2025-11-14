import React from 'react';

const CustomBadge = ({ status, children }) => {
    const statusColors = {
        active: "bg-green-500 text-white",
        paid: "bg-green-500 text-white",
        approved: "bg-green-500 text-white",
        rejected: "bg-red-500 text-white",
        canceled: "bg-red-500 text-white",
        inactive: "bg-red-500 text-white",
        pending: "bg-yellow-500 text-black",
        parked: "bg-yellow-500 text-black",
        away: "bg-yellow-500 text-black"
    };

    const badgeClass = statusColors[status] || "bg-gray-300 text-black";

    return (
        <div>
            <span className={`inline-block px-2 text-sm font-semibold rounded ${badgeClass}`}>
                {children}
            </span>
        </div>
    );
};

export default CustomBadge;