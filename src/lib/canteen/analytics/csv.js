/**
 * Serialize an overview into a spreadsheet-safe CSV report.
 * @param {import("./types.js").Overview} overview
 */
export function toCsv(overview) {
  const rows = [
    ["Section", "Name", "Quantity / Orders", "Revenue (paise)", "Rank / Share", "Last order"],
    ["KPI", "Paid orders", overview.kpis.orders.value, "", formatChange(overview.kpis.orders.changePct), ""],
    ["KPI", "Revenue", "", overview.kpis.revenuePaise.value, formatChange(overview.kpis.revenuePaise.changePct), ""],
    ["KPI", "Average order value", "", overview.kpis.averageOrderValuePaise.value, formatChange(overview.kpis.averageOrderValuePaise.changePct), ""],
    ["KPI", "Unique customers", overview.kpis.uniqueCustomers.value, "", formatChange(overview.kpis.uniqueCustomers.changePct), ""],
    ...overview.dailyTrend.map((day) => ["Daily trend", day.date, day.orders, day.revenuePaise, "", ""]),
    ...overview.itemPerformance.map((item) => [
      "Item",
      item.name,
      item.quantity,
      item.revenuePaise,
      item.rank ?? "",
      item.lastOrderAt ?? "",
    ]),
    ...overview.categories.map((category) => ["Category", category.name, "", category.revenuePaise, category.sharePct, ""]),
    ...overview.combos.map((combo) => [
      "Combo",
      `${combo.firstName} + ${combo.secondName}`,
      combo.ordersTogether,
      "",
      combo.orderSharePct,
      "",
    ]),
    ...overview.peakHours.filter((hour) => hour.orders > 0).map((hour) => ["Peak hour", `${hour.hour}:00`, hour.orders, "", "", ""]),
    ...overview.peakDays.filter((day) => day.orders > 0).map((day) => ["Peak day", day.day, day.orders, "", "", ""]),
    ...overview.lowSales.map((item) => ["Review", item.name, item.quantity, item.revenuePaise, item.reason, item.lastOrderAt ?? ""]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/** @param {unknown} value */
export function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

/** @param {number|null} value */
function formatChange(value) {
  return value == null ? "N/A (no prior baseline)" : `${value}%`;
}
