/**
 * Build deterministic suggestions only from the measured overview.
 * @param {import("./types.js").Overview} overview
 */
export function ruleInsights(overview) {
  if (!overview.totalPaidOrders) return [];

  const recs = [];
  const sellers = overview.itemPerformance.filter((item) => item.quantity > 0).slice(0, 3);
  if (sellers.length) {
    recs.push(recommendation(
      "top_sellers",
      "Top sellers",
      `Feature ${sellers.map((item) => `${item.name} (${item.quantity} sold)`).join(", ")} based on paid orders.`,
      sellers.map((item) => item.itemId),
      { quantities: sellers.map((item) => item.quantity) },
    ));
  }

  if (sellers[0]) {
    const bestPartner = overview.combos
      .filter((combo) => combo.firstItemId === sellers[0].itemId || combo.secondItemId === sellers[0].itemId)
      .sort((a, b) => b.ordersTogether - a.ordersTogether)[0];
    const partnerId = bestPartner
      ? bestPartner.firstItemId === sellers[0].itemId ? bestPartner.secondItemId : bestPartner.firstItemId
      : null;
    const partnerName = bestPartner
      ? bestPartner.firstItemId === partnerId ? bestPartner.firstName : bestPartner.secondName
      : null;
    recs.push(recommendation(
      "promotion_idea",
      "Promotion idea",
      partnerId
        ? `Feature ${sellers[0].name} with ${partnerName}; they appeared together in ${bestPartner.ordersTogether} paid orders.`
        : `Feature ${sellers[0].name}, the top item with ${sellers[0].quantity} sold units.`,
      partnerId ? [sellers[0].itemId, partnerId] : [sellers[0].itemId],
      { ordersTogether: bestPartner?.ordersTogether ?? null, quantity: sellers[0].quantity },
    ));
  }

  if (overview.totalPaidOrders >= 20) {
    const quietDay = [...overview.peakDays].sort((a, b) => a.orders - b.orders || a.day.localeCompare(b.day))[0];
    if (quietDay) {
      recs.push(recommendation(
        "promotion_idea",
        "Boost a quieter day",
        `${quietDay.day} had the fewest paid orders (${quietDay.orders}) in this period; consider a day-specific promotion.`,
        [],
        { day: quietDay.day, orders: quietDay.orders, totalPaidOrders: overview.totalPaidOrders },
      ));
    }
  }

  if (overview.lowSales.length) {
    const items = overview.lowSales.slice(0, 10);
    recs.push(recommendation(
      "low_sales_review",
      "Low/no-sales review",
      `${items.map((item) => `${item.name} (${item.quantity} sold)`).join(", ")} may merit a menu-placement review. This is advisory only.`,
      items.map((item) => item.itemId),
      { quantities: items.map((item) => item.quantity) },
    ));
  }

  const pairs = overview.combos.slice(0, 2);
  if (pairs.length) {
    recs.push(recommendation(
      "combo_suggestion",
      "Frequently bought together",
      pairs.map((pair) => `${pair.firstName} + ${pair.secondName} (${pair.ordersTogether} paid orders)`).join("; "),
      [...new Set(pairs.flatMap((pair) => [pair.firstItemId, pair.secondItemId]))],
      { ordersTogether: pairs.map((pair) => pair.ordersTogether) },
    ));
  }
  return recs;
}

/**
 * @param {string} kind
 * @param {string} title
 * @param {string} body
 * @param {string[]} itemIds
 * @param {Record<string, unknown>} metrics
 */
function recommendation(kind, title, body, itemIds, metrics) {
  return { kind, title, body, itemIds, metrics };
}
