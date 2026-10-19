import { WINDOW_DAYS } from "./types.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = "Asia/Kolkata";
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  hourCycle: "h23",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

/**
 * @param {{lines: import("./types.js").SalesLine[], menu: import("./types.js").MenuItem[], now?: Date}} input
 * @returns {import("./types.js").Overview}
 */
export function computeOverview({ lines, menu, now = new Date() }) {
  const validLines = lines.filter(
    (line) =>
      line.paymentStatus === "PAID" &&
      line.orderStatus !== "CANCELLED" &&
      line.orderStatus !== "REJECTED" &&
      Number.isFinite(line.quantity) &&
      line.quantity > 0 &&
      Number.isFinite(line.unitPricePaise) &&
      line.unitPricePaise >= 0 &&
      Number.isFinite(new Date(line.placedAt).getTime()),
  );
  const today = dateKey(now);
  const currentStart = localStart(today, -(WINDOW_DAYS - 1));
  const previousStart = currentStart - WINDOW_DAYS * DAY_MS;
  const currentLines = validLines.filter((line) => {
    const timestamp = new Date(line.placedAt).getTime();
    return timestamp >= currentStart && timestamp <= now.getTime();
  });
  const previousLines = validLines.filter((line) => {
    const timestamp = new Date(line.placedAt).getTime();
    return timestamp >= previousStart && timestamp < currentStart;
  });
  const currentOrders = collectOrders(currentLines);
  const previousOrders = collectOrders(previousLines);
  const itemPerformance = buildItemPerformance(currentLines, menu);
  const totalRevenuePaise = sumRevenue(currentLines);
  const previousRevenuePaise = sumRevenue(previousLines);
  const currentOrderCount = currentOrders.size;
  const previousOrderCount = previousOrders.size;
  const currentCustomers = new Set([...currentOrders.values()].map((order) => order.customerId).filter(Boolean));
  const previousCustomers = new Set([...previousOrders.values()].map((order) => order.customerId).filter(Boolean));
  const currentAverage = currentOrderCount ? Math.round(totalRevenuePaise / currentOrderCount) : 0;
  const previousAverage = previousOrderCount ? Math.round(previousRevenuePaise / previousOrderCount) : 0;

  return {
    kpis: {
      orders: kpi(currentOrderCount, previousOrderCount),
      revenuePaise: kpi(totalRevenuePaise, previousRevenuePaise),
      averageOrderValuePaise: kpi(currentAverage, previousAverage),
      uniqueCustomers: kpi(currentCustomers.size, previousCustomers.size),
    },
    dailyTrend: buildDailyTrend(currentLines, today),
    itemPerformance,
    lowSales: buildLowSales(itemPerformance),
    combos: buildCombos(currentLines, currentOrderCount, menu),
    categories: buildCategories(currentLines),
    peakHours: buildPeakHours(currentLines),
    peakDays: buildPeakDays(currentLines),
    totalPaidOrders: currentOrderCount,
    totalRevenuePaise,
  };
}

/** @param {number} value @param {number} previous */
function kpi(value, previous) {
  return {
    value,
    previous,
    changePct: previous === 0 ? (value === 0 ? 0 : null) : Math.round(((value - previous) / previous) * 100),
  };
}

/** @param {import("./types.js").SalesLine[]} lines */
function collectOrders(lines) {
  const orders = new Map();
  for (const line of lines) {
    const existing = orders.get(line.orderId);
    if (existing) {
      existing.revenuePaise += line.quantity * line.unitPricePaise;
      continue;
    }
    orders.set(line.orderId, {
      customerId: line.customerId,
      placedAt: line.placedAt,
      revenuePaise: line.quantity * line.unitPricePaise,
    });
  }
  return orders;
}

/** @param {import("./types.js").SalesLine[]} lines */
function sumRevenue(lines) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPricePaise, 0);
}

/** @param {import("./types.js").SalesLine[]} lines @param {import("./types.js").MenuItem[]} menu */
function buildItemPerformance(lines, menu) {
  const byId = new Map();
  for (const line of lines) {
    if (!line.itemId) continue;
    const existing = byId.get(line.itemId) ?? {
      quantity: 0,
      revenuePaise: 0,
      lastOrderAt: null,
    };
    existing.quantity += line.quantity;
    existing.revenuePaise += line.quantity * line.unitPricePaise;
    if (!existing.lastOrderAt || new Date(line.placedAt) > new Date(existing.lastOrderAt)) {
      existing.lastOrderAt = line.placedAt;
    }
    byId.set(line.itemId, existing);
  }

  /** @type {import("./types.js").ItemPerformance[]} */
  const items = menu.map((menuItem) => {
    const sales = byId.get(menuItem.id);
    return {
      itemId: menuItem.id,
      name: menuItem.name,
      categoryName: menuItem.categoryName || "Others",
      availability: menuItem.availability,
      quantity: sales?.quantity ?? 0,
      revenuePaise: sales?.revenuePaise ?? 0,
      lastOrderAt: sales?.lastOrderAt ?? null,
      rank: null,
    };
  });
  const sold = items
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity || b.revenuePaise - a.revenuePaise || a.name.localeCompare(b.name));
  sold.forEach((item, index) => {
    item.rank = index + 1;
  });
  return items.sort((a, b) => {
    if (a.rank != null && b.rank != null) return a.rank - b.rank;
    if (a.rank != null) return -1;
    if (b.rank != null) return 1;
    return a.name.localeCompare(b.name);
  });
}

/** @param {import("./types.js").ItemPerformance[]} items */
/** @param {import("./types.js").ItemPerformance[]} items
 * @returns {import("./types.js").LowSalesItem[]}
 */
function buildLowSales(items) {
  const available = items.filter((item) => item.availability === "AVAILABLE");
  const topQuantity = Math.max(0, ...available.map((item) => item.quantity));
  const cutoff = Math.max(3, topQuantity * 0.1);
  return available
    .filter((item) => item.quantity <= cutoff)
    .map((item) => ({
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity,
      revenuePaise: item.revenuePaise,
      lastOrderAt: item.lastOrderAt,
      reason: item.quantity === 0 ? "no_sales" : "low_sales",
    }));
}

/** @param {import("./types.js").SalesLine[]} lines @param {number} totalOrders @param {import("./types.js").MenuItem[]} menu */
function buildCombos(lines, totalOrders, menu) {
  if (!totalOrders) return [];
  const nameById = new Map(menu.map((item) => [item.id, item.name]));
  const byOrder = new Map();
  for (const line of lines) {
    if (!line.itemId) continue;
    if (!byOrder.has(line.orderId)) byOrder.set(line.orderId, new Set());
    byOrder.get(line.orderId).add(line.itemId);
  }
  const pairCounts = new Map();
  for (const ids of byOrder.values()) {
    const bounded = [...ids].sort().slice(0, 15);
    for (let i = 0; i < bounded.length; i += 1) {
      for (let j = i + 1; j < bounded.length; j += 1) {
        const key = `${bounded[i]}\u0000${bounded[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }
  return [...pairCounts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([key, ordersTogether]) => {
      const [firstItemId, secondItemId] = key.split("\u0000");
      return {
        firstItemId,
        secondItemId,
        firstName: nameById.get(firstItemId) ?? "Menu item",
        secondName: nameById.get(secondItemId) ?? "Menu item",
        ordersTogether,
        orderSharePct: Math.round((ordersTogether / totalOrders) * 1000) / 10,
      };
    })
    .sort((a, b) => b.ordersTogether - a.ordersTogether || a.firstName.localeCompare(b.firstName) || a.secondName.localeCompare(b.secondName))
    .slice(0, 5);
}

/** @param {import("./types.js").SalesLine[]} lines */
function buildCategories(lines) {
  const totals = new Map();
  for (const line of lines) {
    const name = line.categoryName || "Others";
    totals.set(name, (totals.get(name) ?? 0) + line.quantity * line.unitPricePaise);
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([name, revenuePaise]) => ({
      name,
      revenuePaise,
      sharePct: total ? Math.round((revenuePaise / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenuePaise - a.revenuePaise || a.name.localeCompare(b.name));
}

/** @param {import("./types.js").SalesLine[]} lines */
function buildPeakHours(lines) {
  const orderHours = new Map();
  for (const line of lines) {
    if (!orderHours.has(line.orderId)) orderHours.set(line.orderId, new Set());
    orderHours.get(line.orderId).add(Number(hourFormatter.format(new Date(line.placedAt))));
  }
  const counts = Array(24).fill(0);
  for (const hours of orderHours.values()) {
    for (const hour of hours) counts[hour] += 1;
  }
  return counts.map((orders, hour) => ({ hour, orders }));
}

/** @param {import("./types.js").SalesLine[]} lines */
function buildPeakDays(lines) {
  const orderDays = new Map();
  for (const line of lines) {
    if (!orderDays.has(line.orderId)) orderDays.set(line.orderId, new Set());
    orderDays.get(line.orderId).add(weekdayFormatter.format(new Date(line.placedAt)));
  }
  const counts = new Map(DAY_NAMES.map((day) => [day, 0]));
  for (const days of orderDays.values()) {
    for (const day of days) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return DAY_NAMES.map((day) => ({ day, orders: counts.get(day) ?? 0 }));
}

/** @param {import("./types.js").SalesLine[]} lines @param {string} today */
function buildDailyTrend(lines, today) {
  const daily = new Map();
  for (let ago = WINDOW_DAYS - 1; ago >= 0; ago -= 1) {
    const date = shiftDate(today, -ago);
    daily.set(date, { date, revenuePaise: 0, orders: new Set() });
  }
  for (const line of lines) {
    const date = dateKey(new Date(line.placedAt));
    const bucket = daily.get(date);
    if (!bucket) continue;
    bucket.revenuePaise += line.quantity * line.unitPricePaise;
    bucket.orders.add(line.orderId);
  }
  return [...daily.values()].map(({ date, revenuePaise, orders }) => ({
    date,
    revenuePaise,
    orders: orders.size,
  }));
}

/** @param {Date} date */
function dateKey(date) {
  return dateFormatter.format(date);
}

/** @param {string} date @param {number} offset */
function shiftDate(date, offset) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}

/** @param {string} date @param {number} daysOffset */
function localStart(date, daysOffset) {
  const shifted = shiftDate(date, daysOffset);
  const [year, month, day] = shifted.split("-").map(Number);
  return Date.UTC(year, month - 1, day) - 330 * 60 * 1000;
}
