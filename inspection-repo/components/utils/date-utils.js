// www, dd mmm yyyy
// Mon, 10 Jul 2023
export function getDate_wwwddmmyyyy(date) {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
  });
}

// dd_month_yyyy
// 02_April_2023
export function getDate_dd_month_yyyy(date) {
  return date
    .toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })
    .replace(/ /g, "_");
}

// 10:03:22 PM
export function getTime_hhmmssaa(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 07/10/2023
export function getDate_dd_mm_yyyy(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
