import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";

const SidebarDropdown = ({ item, location, isOpen, onToggle }) => {
    const isActive = item.children.some(child => location.pathname.startsWith(child.path));

    const [maxHeight, setMaxHeight] = useState(isOpen ? 'max-h-screen' : 'max-h-0');
    const contentRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMaxHeight(`${contentRef.current.scrollHeight}px`);
        } else {
            setMaxHeight('0px');
        }
    }, [isOpen]);

    return (
        <div className="rounded-lg">
            <button
                onClick={onToggle} 
                className={`flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 transition-all 
                    ${isActive ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-muted"}
                    ${isActive ? "dark:bg-primary dark:text-black dark:shadow-lg" : "dark:text-muted-foreground dark:hover:bg-muted"}`}
            >
                <div className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div
                ref={contentRef}
                className={`overflow-hidden transition-[max-height] duration-300 ease-in-out`}
                style={{ maxHeight }}
            >
                <div className="mt-1 ml-2 border-l-2">
                    {item.children.map((child, index) => (
                        child.permission ? (
                            <Link
                                key={index}
                                to={child.path}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all relative
                                    ${location.pathname.startsWith(child.path) ? "bg-muted ml-1 text-black border-l-4 border-primary" : "text-muted-foreground hover:bg-muted"}
                                    ${location.pathname.startsWith(child.path) ? "dark:bg-primary ml-1 dark:text-black dark:shadow-lg border-primary" : "dark:text-muted-foreground dark:hover:bg-muted"}`}
                            >
                                {child.label}
                            </Link>
                        ) : null
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SidebarDropdown;
