import { useSelector } from "react-redux";
import { format } from "date-fns";
import toast from "react-hot-toast";
import axiosMerchant from "@/axios";
import moment from "@/utils/moment";
import { useMemo, useState } from "react";
import { wktToGeoJSON } from "@terraformer/wkt";

export const norm = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[’'`]/g, "'")
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u");

export const normalizeArabic = (s) =>
  norm(s)
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");

export function levenshtein(a, b) {
  a = norm(a);
  b = norm(b);
  const m = a.length,
    n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export function similarity(a, b) {
  if (!a || !b) return 0;
  const A = norm(a),
    B = norm(b);
  const dist = levenshtein(A, B);
  const maxLen = Math.max(A.length, B.length) || 1;
  return 1 - dist / maxLen;
}
export const normalizeNumber = (num) => {
  if (!num) return "";
  return String(num).replace(/\D/g, "");
};
export function bestFuzzy(list, target, getNames, threshold = 0.74) {
  if (!target || !list?.length) return null;
  const t = norm(target);
  let best = null,
    bestScore = 0;

  for (const item of list) {
    const names = getNames(item).filter(Boolean);
    const scores = names.map((n) => {
      const s1 = similarity(n, t);
      const s2 = similarity(normalizeArabic(n), normalizeArabic(t));
      const containBoost =
        norm(n).includes(t) || t.includes(norm(n)) ? 0.06 : 0;
      return Math.max(s1, s2) + containBoost;
    });
    const score = Math.max(...scores, 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore >= threshold ? best : null;
}

export const ALIASES = {
  sahar: "sohar",
  "a’seeb": "as seeb",
  "a seeb": "as seeb",
  صحار: "صحار",
};
export const authUser = () => {
  return useSelector((store) => store.auth.user) ?? null;
};

export const area_name = (name) => {
  return;
};
export const parsePolygon = (input) => {
  if (!input) return [];
  let geometry;
  if (typeof input === "string") {
    try {
      geometry = wktToGeoJSON(input);
    } catch (e) {
      console.error("Failed to parse WKT:", e);
      return [];
    }
  } else if (input.type === "Polygon" || input.type === "MultiPolygon") {
    geometry = input;
  } else if (input.type === "Feature" && input.geometry) {
    geometry = input.geometry;
  } else {
    console.error("Unsupported geometry format:", input);
    return [];
  }

  const processPolygonCoordinates = (coords) => {
    return coords.map((ring) => ring.map(([lng, lat]) => ({ lat, lng })));
  };

  if (geometry.type === "Polygon") {
    return [processPolygonCoordinates(geometry.coordinates)];
  } else if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygonCoords) =>
      processPolygonCoordinates(polygonCoords)
    );
  } else {
    return [];
  }
};

export const useHubInformation = (shipment) => {
  const memoizedHubInfo = useMemo(() => {
    if (!shipment?.status || !shipment?.shipment_histories) {
      return { from: "_", current: "_", to: "_" };
    }
    return getHubInformationByShipmentStatus(
      shipment.status,
      shipment.shipment_histories
    );
  }, [shipment?.status, shipment?.shipment_histories]);
  return memoizedHubInfo;
};

export const can = (permissionName) => {
  const user = useSelector((state) => state.auth.user);

  if (user?.role?.name.toLowerCase() === "super admin") {
    return true;
  }

  const rolePerms = user?.role?.permissions || [];
  const userPerms = user?.permissions || [];
  // Merge permissions with unique names (in case of duplicates)
  const allPerms = [...rolePerms, ...userPerms];
  // Use a Set to ensure unique permission names (optional, but safe)
  const uniquePermNames = new Set(allPerms.map((p) => p.name));
  return uniquePermNames.has(permissionName);
};

// export const can = (permissionName) => {
//   const user = useSelector((state) => state.auth.user);

//   if (user?.role?.name.toLowerCase() === "Super Admin".toLowerCase()) {
//     return true;
//   }

//   const userPermissions = user?.role?.permissions || [];

//   return userPermissions.some(
//     (permission) => permission.name === permissionName
//   );
// };

export const hasRole = (role) => {
  const user = useSelector((store) => store.auth.user);
  if (!user || !user.role || !user.role.name) {
    console.error("Error.");
    return false;
  }
  if (Array.isArray(role)) {
    return role.some((r) => user.role.name.toLowerCase() === r.toLowerCase());
  } else {
    return user.role.name.toLowerCase() === role.toLowerCase();
  }
};

export const hasNotRole = (roles) => {
  const user = useSelector((store) => store.auth.user);

  if (!user || !user.role || !user.role.name) {
    console.error("Error: User role not found.");
    return false;
  }

  const userRole = user.role.name.toLowerCase();

  if (Array.isArray(roles)) {
    return !roles.some((role) => role.toLowerCase() === userRole);
  }

  return roles.toLowerCase() !== userRole;
};

export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getMonth = (createdAt) => {
  const date = new Date(createdAt);

  if (isNaN(date)) {
    throw new Error("Invalid date format");
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[date.getMonth()];
};

export const truncateWord = (text, wordLimit) => {
  const words = text.split(" ");
  return words.length > wordLimit
    ? words.slice(0, wordLimit).join(" ") + "..."
    : text;
};

export const truncateText = (text, charLimit) => {
  return text.length > charLimit ? text.slice(0, charLimit) + "..." : text;
};

export const monthList = () => {
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];
  return months;
};

export const dateFormat = (date, formatType) => {
  const dateObj = new Date(date);

  switch (formatType) {
    case "datetime":
      return format(dateObj, "dd MMM yyyy HH:mm");
    case "time":
      return format(dateObj, "HH:mm");
    case "date":
      return format(dateObj, "dd MMM yyyy");
    case "full":
      return format(dateObj, "EEEE, dd MMM yyyy HH:mm:ss");
    default:
      return format(dateObj, "dd MMM yyyy HH:mm");
  }
};

export const handleError = (error) => {
  if (error.response) {
    const { data } = error.response;
    if (data.errors) {
      Object.values(data.errors)
        .flat()
        .forEach((message) => {
          console.error(message);
          toast.error(message);
        });
    } else if (data.message) {
      console.error(data.message);
      toast.error(data.message);
    } else {
      console.error("An error occurred:", data);
      toast.error("An error occurred. Please try again.");
    }
  } else if (error.request) {
    console.error("Server is not responding:", error.message);
    toast.error("The server is not responding. Please try again later.");
  } else {
    console.error("Unexpected error:", error.message);
    toast.error(`Unexpected error: ${error.message}`);
  }
};

export async function getSelectData(api) {
  const response = await axiosMerchant.get(api);
  console.log(response.data);
  return response.data;
}

export const printLabel = (data) => {
  // Re-implemented to force content to a single 4×6-inch (100 × 150 mm) page
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const { document: doc, addEventListener: addFrameListener } =
      iframe.contentWindow;
    const PAGE_STYLE = `
      @page {
        size: 100mm 150mm;
        margin: 0;
      }
      @media print {
        html, body {
          width: 100mm;
          height: 150mm;
          margin: 0;
          padding: 0;
          overflow: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;

    const writeMarkup = () => {
      const hasHtmlWrapper = /<html[\s>]/i.test(data);
      doc.open();
      if (hasHtmlWrapper) {
        doc.write(data);
      } else {
        doc.write(`<html><head></head><body>${data}</body></html>`);
      }
      doc.close();
    };

    const injectPageStyle = () => {
      const styleTag = doc.createElement("style");
      styleTag.setAttribute("type", "text/css");
      styleTag.textContent = PAGE_STYLE;
      const head = doc.head || doc.getElementsByTagName("head")[0];
      if (head) {
        head.appendChild(styleTag);
      } else if (doc.body) {
        doc.body.insertBefore(styleTag, doc.body.firstChild);
      }
    };

    const waitForReadyState = () =>
      new Promise((readyResolve) => {
        if (doc.readyState === "complete") {
          readyResolve();
          return;
        }
        const handleLoad = () => {
          iframe.removeEventListener("load", handleLoad);
          readyResolve();
        };
        iframe.addEventListener("load", handleLoad);
      });

    const waitForImages = () =>
      new Promise((imagesResolved) => {
        const images = Array.from(doc.querySelectorAll("img"));
        if (!images.length) {
          imagesResolved();
          return;
        }
        let remaining = images.length;
        const finish = () => {
          remaining -= 1;
          if (remaining <= 0) {
            clearTimeout(fallbackTimer);
            imagesResolved();
          }
        };
        const fallbackTimer = setTimeout(imagesResolved, 2500);
        images.forEach((img) => {
          if (img.complete) {
            finish();
          } else {
            img.addEventListener("load", finish, { once: true });
            img.addEventListener("error", finish, { once: true });
          }
        });
      });

    let openTime = 0;
    let dialogOpened = false;

    let cleanedUp = false;
    const cleanup = (printed) => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearTimeout(shortFallbackTimer);
      clearTimeout(longFallbackTimer);
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve({ success: true, printed });
      }, 300);
    };

    iframe.contentWindow.onbeforeprint = () => {
      dialogOpened = true;
      openTime = Date.now();
    };

    iframe.contentWindow.onafterprint = () => {
      const printed = dialogOpened && Date.now() - openTime > 1500;
      cleanup(printed);
    };

    const triggerPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Print error:", err);
        cleanup(false);
      }
    };

    const prepareAndPrint = async () => {
      try {
        injectPageStyle();
        await waitForImages();
        requestAnimationFrame(() => {
          requestAnimationFrame(triggerPrint);
        });
      } catch (err) {
        console.error("Print preparation error:", err);
        triggerPrint();
      }
    };

    writeMarkup();
    waitForReadyState().then(prepareAndPrint);

    // Fallback cleanup after 30 s
    const shortFallbackTimer = setTimeout(() => cleanup(false), 7000);
    const longFallbackTimer = setTimeout(() => cleanup(false), 30000);
  });
};

export const printShipmentLabel = (htmlContent) => {
  return new Promise((resolve) => {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);
    const frameDoc =
      printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();
    }
    let printStartTime = 0;
    let printDialogOpened = false;
    let printCompleted = false;
    printFrame.contentWindow?.addEventListener("beforeprint", () => {
      printDialogOpened = true;
      printStartTime = Date.now();
      console.log("تم فتح نافذة الطباعة");
    });
    printFrame.contentWindow?.addEventListener("afterprint", () => {
      if (!printDialogOpened) return;
      const printDuration = Date.now() - printStartTime;
      console.log(`مدة بقاء نافذة الطباعة: ${printDuration}ms`);
      const wasPrinted = printDuration > 2000;
      setTimeout(() => {
        printCompleted = true;
        document.body.removeChild(printFrame);
        resolve({ success: true, printed: wasPrinted });
      }, 300);
    });
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (e) {
        console.error("خطأ في تنفيذ الطباعة:", e);
        document.body.removeChild(printFrame);
        resolve({ success: false, printed: false });
      }
    }, 500);
    setTimeout(() => {
      if (!printCompleted && document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
        resolve({ success: printDialogOpened, printed: false });
      }
    }, 30000);
  });
};

export const printTruckBarcode = (data) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(data);
  iframeDoc.close();

  iframe.contentWindow.print();

  iframe.onload = () => {
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
};

export const printWaybill = (data) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "378px";
  iframe.style.height = "378px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(data);
  iframeDoc.close();

  const image = iframeDoc.querySelector("img");
  image.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.print();
    }, 500);
  };

  image.onerror = () => {
    setTimeout(() => {
      iframe.contentWindow.print();
    }, 500);
  };

  iframe.onload = () => {
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
};

export const printInvoice = (data) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(data);
  iframeDoc.close();

  iframe.contentWindow.print();

  iframe.onload = () => {
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
};

export const getOwner = (object) => {
  if (!object || !object.owner_type) {
    return "No Ownership Assigned";
  }
  switch (object.owner_type) {
    case "App\\Models\\Branch":
      return `${object.owner.name} | Branch`;
    case "App\\Models\\Station":
      return `${object.owner.name} | Station`;
    case "App\\Models\\Hub":
      return `${object.owner.name} | Hub`;
    default:
      return "No Ownership Assigned";
  }
};

export const getOwnership = (user) => {
  return user.owner?.name || "No Ownership Assigned";
};

export const convertBoolean = (data) => {
  if (data === 1) return "Yes";
  else return "No";
};

export const getSetting = (key) => {
  const settings = useSelector((store) => store.auth.user.settings);
  const setting = settings.find((setting) => setting.key === key);
  return setting.value || null;
};

export const consigneeAddress = (data) => {
  if (!data) {
    return "Invalid data provided";
  }

  const country = data.country
    ? `${data.country.name || "Country"})`
    : "Country (الدولۃ)";
  const governorate = data.governorate
    ? `${data.governorate.en_name || "Governorate"} (${
        data.governorate.ar_name || "المحافظة"
      })`
    : "Governorate (المحافظة)";

  const state = data.state
    ? `${data.state.en_name || "State"} (${data.state.ar_name || "الولاية"})`
    : "State (الولاية)";

  const place = data.place
    ? `${data.place.en_name || "Place"} (${data.place.ar_name || "المكان"})`
    : "Place (المكان)";

  return `${place}, ${state}, ${governorate}, ${country}`;
};

export const driverName = (data) => {
  if (!data || typeof data !== "object") {
    return "N/A - N/A";
  }

  const fullPhone = data.driver?.phone;
  const last4 =
    typeof fullPhone === "string" && fullPhone.length >= 4
      ? fullPhone.slice(-4)
      : "N/A";

  const name = data.name ?? "N/A";

  return `${last4} - ${name}`;
};

// export const driverName = (data) => {
//   if (!data || typeof data !== "object") {
//     return "N/A - N/A";
//   }

//   const phone = data.driver?.phone ?? "N/A";
//   const name = data.name ?? "N/A";

//   return `${phone} - ${name}`;
// };

export const merchantName = (data) => {
  if (!data || typeof data !== "object") {
    return "N/A - N/A";
  }

  const id = data.id ?? "N/A";
  const name = data.name ?? "N/A";

  return `${id} - ${name}`;
};

export const truckName = (data) => {
  if (!data || typeof data !== "object") {
    return "N/A - N/A";
  }
  const numberPlate = data.number_plate ?? "N/A";
  const color = data.color ?? "N/A";
  return `${numberPlate} - ${color}`;
};

export const truckDriverName = (data) => {
  if (!data || typeof data !== "object") {
    return "N/A - N/A";
  }
  const name = data.name ?? "N/A";
  const phoneNumber = data.phone_number ?? "N/A";
  return `${phoneNumber} - ${name}`;
};

export const selectTransferTask = (task) => {
  console.log(task);
  if (!task || !task.truck_driver || !task.truck) return "";
  return `${task.truck_driver?.user?.name} - ${task.truck?.number_plate} - #${
    task.id
  } - ${task.status} - ${moment(task.created_at).format("DD-MM-YYYY")}`;
};

export const selectTransferDestination = (data) => {
  if (!data || !data.destination) return "";
  return data.destination.name;
};

export const getDestinationShipmentCount = (destinations, id) => {
  if (!destinations || !id) return 0;
  const selectedDestination = destinations.find(
    (destination) => destination.id === id
  );
  return selectedDestination?.pending_shipments_count || 0;
};

export const humanizeText = (text) => {
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatCurrency = (
  amount,
  language,
  decimalPrecision,
  currencyEnglishName,
  currencyArabicName
) => {
  const currencyName = formatCurrentCurrency(
    currencyEnglishName,
    currencyArabicName,
    language
  );
  return `${formatDecimalValue(amount, decimalPrecision)} ${currencyName}`;
};

export const formatTime = (minutes) => {
  if (!minutes) return "0h 0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const formatLargeNumber = (num) => {
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

// export const printExportData = (data, options = {}) => {
//   const iframe = document.createElement("iframe");
//   const config = {
//     width: "0px",
//     height: "0px",
//     waitForImages: false,
//     removeDelay: 1000,
//     printDelay: 500,
//     ...options,
//   };

//   // Set iframe styles
//   iframe.style.position = "absolute";
//   iframe.style.width = config.width;
//   iframe.style.height = config.height;
//   iframe.style.border = "none";
//   document.body.appendChild(iframe);

//   const iframeDoc = iframe.contentWindow.document;
//   iframeDoc.open();
//   iframeDoc.write(data);
//   iframeDoc.close();

//   const handlePrint = () => {
//     setTimeout(() => {
//       iframe.contentWindow.print();
//     }, config.printDelay);
//   };

//   // Handle image loading if required
//   if (config.waitForImages) {
//     const images = iframeDoc.querySelectorAll("img");
//     let imagesToLoad = images.length;

//     if (imagesToLoad === 0) {
//       handlePrint();
//       return;
//     }

//     const imageLoaded = () => {
//       imagesToLoad--;
//       if (imagesToLoad === 0) {
//         handlePrint();
//       }
//     };

//     images.forEach((img) => {
//       if (img.complete) {
//         imageLoaded();
//       } else {
//         img.addEventListener("load", imageLoaded);
//         img.addEventListener("error", imageLoaded);
//       }
//     });
//   } else {
//     handlePrint();
//   }

//   // Cleanup
//   iframe.addEventListener("load", () => {
//     setTimeout(() => {
//       document.body.removeChild(iframe);
//     }, config.removeDelay);
//   });
// };

export const printExportData = (data) => {
  console.log(data);
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(data);
  iframeDoc.close();

  iframe.contentWindow.print();

  iframe.onload = () => {
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
};

export const fileDownloader = async ({
  url,
  fileName,
  headers = {},
  method = "GET",
  data = null,
}) => {
  try {
    const response = await axiosMerchant({
      url,
      method,
      data,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    const contentDisposition = response.headers["content-disposition"];
    const finalFileName =
      fileName || contentDisposition?.split("filename=")[1] || "download";

    link.href = downloadUrl;
    link.setAttribute("download", finalFileName);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
};

export const useDownload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async (params) => {
    setLoading(true);
    setError(null);

    try {
      await fileDownloader(params);
    } catch (err) {
      setError(err.message || "Download failed");
    } finally {
      setLoading(false);
    }
  };

  return { handleDownload, loading, error };
};

export const isAuthorized = (requiredPermissions = []) => {
  const user = useSelector((store) => store.auth.user);

  if (!user) return false;

  if (user.role?.name.toLowerCase() === "super admin") {
    return true;
  }

  const userPerms = user.role?.permissions?.map((p) => p.name) || [];

  return requiredPermissions.some((rp) => userPerms.includes(rp));
};

// Tab management utilities
export const generateTabId = (pathname) => {
  const normalizePath = (path) => (path === "/" ? "/dashboard" : path);
  return `tab-${normalizePath(pathname)}`;
};

export const closeCurrentTab = (
  navigate,
  dispatch,
  closeTab,
  targetPath = "/dashboard"
) => {
  // Get current pathname
  const currentPath = window.location.pathname;
  const currentTabId = generateTabId(currentPath);

  // Close the current tab
  dispatch(closeTab(currentTabId));

  // Navigate to target path
  navigate(targetPath);
};

export const statusOptions = [
  {
    value: "CREATED",
    label: "Created",
  },
  {
    value: "SORT",
    label: "Sorted",
  },
  {
    value: "DISPATCH",
    label: "Dispatched",
  },
  {
    value: "DELIVERY_EXCEPTION",
    label: "Delivery Exception",
  },
  {
    value: "OFD",
    label: "OFD",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
  {
    value: "RETURNED",
    label: "Returned",
  },
  {
    value: "MOVE_TO_AREA",
    label: "Move to Area",
  },
  {
    value: "MOVE_TO_DISPATCH",
    label: "Move to Dispatch",
  },
  {
    value: "MOVE_TO_SUPERVISOR",
    label: "Move to Supervisor",
  },
  {
    value: "MOVE_TO_SHELF",
    label: "Move to Shelf",
  },
];

export const exceptionStatusOptions = [
  {
    value: "NO_ANSWER",
    label: "No Answer",
  },
  {
    value: "FUTURE_DELIVERY",
    label: "Future Delivery",
  },
  {
    value: "WRONG_CITY",
    label: "Wrong City",
  },
  {
    value: "WRONG_NUMBER",
    label: "Wrong Number",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
  {
    value: "DELIVER_LATER_TODAY",
    label: "DELIVER LATER TODAY",
  },
  {
    value: "RETURNED",
    label: "Returned",
  },
  {
    value: "TOMORROW",
    label: "TOMORROW",
  },
];

export const formatDecimalValue = (value, decimalPrecision) => {
  if (value === null || value === undefined)
    return `0.${"0".repeat(decimalPrecision || 2)}`;

  const num = parseFloat(value);
  if (isNaN(num)) return `0.${"0".repeat(decimalPrecision || 2)}`;

  return num.toFixed(decimalPrecision || 2);
};

export const formatCurrentCurrency = (
  currencyEnglishName,
  currencyArabicName,
  currentLanguage
) => {
  if (currentLanguage === "ar" && currencyArabicName) {
    return `${currencyArabicName}`;
  }
  return `${currencyEnglishName}`;
};
