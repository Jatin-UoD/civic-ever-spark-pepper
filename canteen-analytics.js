
/**
 * @typedef {import("./src/lib/canteen/domain.ts").Availability} Availability
 * @typedef {{
 *   id: string;
 *   name: string;
 *   categoryName: string;
 *   availability: Availability;
 *   quantitySold: number;
 *   revenuePaise: number;
 *   lastOrderedAt: string | null;
 *   rank: number | null;
 * }} SalesItem
 * @typedef {{
 *   periodDays: 14;
 *   items: SalesItem[];
 *   pairs: { firstItemId: string; secondItemId: string; ordersTogether: number }[];
 * }} SalesSnapshot
 * @typedef {{
 *   reviewItemIds: string[];
 *   promoteItemIds: string[];
 *   comboPairs: string[][];
 * }} SalesSelection
 * @typedef {{
 *   reviewCandidates: SalesItem[];
 *   promotionCandidates: SalesItem[];
 *   comboCandidates: { itemIds: [string, string]; ordersTogether: number }[];
 * }} SalesCandidatePools
 */

/** @param {Omit<SalesItem, "rank">[]} items */
export function rankSalesItems(items) {
  /** @type {SalesItem[]} */
  const ranked = items.map((item) => ({ ...item, rank: null }));
  const sold = ranked
    .filter((item) => item.quantitySold > 0)
    .sort((a, b) =>
      b.quantitySold - a.quantitySold ||
      b.revenuePaise - a.revenuePaise ||
      a.name.localeCompare(b.name),
    );

  sold.forEach((item, index) => {
    item.rank = index + 1;
  });
  return ranked;
}

/** @param {SalesSnapshot} snapshot */
export function buildSalesCandidatePools(snapshot) {
  const reviewCandidates = snapshot.items
    .filter((item) => item.availability !== "HIDDEN" && item.quantitySold <= 2)
    .sort((a, b) => a.quantitySold - b.quantitySold || a.name.localeCompare(b.name))
    .slice(0, 12);
  const promotionCandidates = snapshot.items
    .filter((item) => item.availability === "AVAILABLE" && item.quantitySold > 0)
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 8);

  const pairCounts = new Map(
    snapshot.pairs.map((pair) => [pairKey(pair.firstItemId, pair.secondItemId), pair.ordersTogether]),
  );
  /** @type {SalesCandidatePools["comboCandidates"]} */
  const comboCandidates = [];
  for (let i = 0; i < promotionCandidates.length; i += 1) {
    for (let j = i + 1; j < promotionCandidates.length; j += 1) {
      const first = promotionCandidates[i].id;
      const second = promotionCandidates[j].id;
      comboCandidates.push({
        itemIds: [first, second],
        ordersTogether: pairCounts.get(pairKey(first, second)) ?? 0,
      });
    }
  }
  const observedComboCandidates = comboCandidates.filter((pair) => pair.ordersTogether > 0);

  return {
    reviewCandidates,
    promotionCandidates,
    comboCandidates: observedComboCandidates.length ? observedComboCandidates : comboCandidates,
  };
}

/**
 * @param {SalesSelection} selection
 * @param {SalesCandidatePools} pools
 */
export function isValidSalesSelection(selection, pools) {
  const reviewIds = new Set(pools.reviewCandidates.map((item) => item.id));
  const promoteIds = new Set(pools.promotionCandidates.map((item) => item.id));
  if (
    !hasOnlyUniqueAllowedIds(selection.reviewItemIds, reviewIds) ||
    !hasOnlyUniqueAllowedIds(selection.promoteItemIds, promoteIds)
  ) {
    return false;
  }

  const allowedPairs = new Set(pools.comboCandidates.map((pair) => pairKey(...pair.itemIds)));
  const selectedPairs = new Set();
  for (const [first, second] of selection.comboPairs) {
    const key = pairKey(first, second);
    if (first === second || !allowedPairs.has(key) || selectedPairs.has(key)) return false;
    selectedPairs.add(key);
  }
  return true;
}

/** @param {number} currentQuantity @param {number} baselineQuantity */
export function demandGrowthPercent(currentQuantity, baselineQuantity) {
  if (!Number.isFinite(currentQuantity) || !Number.isFinite(baselineQuantity) || baselineQuantity <= 0) return 0;
  return Math.max(0, Math.round(((currentQuantity - baselineQuantity) / baselineQuantity) * 100));
}

/**
 * @param {number} growthPercent
 * @param {{ moderateDemandPercent: number; moderatePricePercent: number; highDemandPercent: number; highPricePercent: number }} settings
 */
export function demandPriceIncreasePercent(growthPercent, settings) {
  if (growthPercent >= settings.highDemandPercent) return Math.min(20, settings.highPricePercent);
  if (growthPercent >= settings.moderateDemandPercent) return Math.min(20, settings.moderatePricePercent);
  return 0;
}

/**
 * @param {SalesSnapshot} snapshot
 * @param {SalesCandidatePools} pools
 * @param {SalesSelection} selection
 */
export function buildSalesRecommendations(snapshot, pools, selection) {
  const itemById = new Map(snapshot.items.map((item) => [item.id, item]));
  const pairByKey = new Map(pools.comboCandidates.map((pair) => [pairKey(...pair.itemIds), pair]));
  return {
    review: selection.reviewItemIds.map((id) => {
      const item = requiredItem(itemById, id);
      return {
        ...compactItem(item),
        reason: item.quantitySold === 0 ? "NO_RECENT_SALES" : "LOW_RECENT_SALES",
      };
    }),
    promote: selection.promoteItemIds.map((id) => ({
      ...compactItem(requiredItem(itemById, id)),
      reason: "TOP_SELLER",
    })),
    combos: selection.comboPairs.map(([firstId, secondId]) => {
      const pair = pairByKey.get(pairKey(firstId, secondId));
      if (!pair) throw new Error("Combo recommendation is outside the verified candidate set.");
      return {
        items: [compactItem(requiredItem(itemById, firstId)), compactItem(requiredItem(itemById, secondId))],
        ordersTogether: pair.ordersTogether,
      };
    }),
  };
}

/**
 * @param {Map<string, SalesItem>} items
 * @param {string} id
 */
function requiredItem(items, id) {
  const item = items.get(id);
  if (!item) throw new Error("Sales recommendation is outside the verified snapshot.");
  return item;
}

/**
 * @param {string[]} ids
 * @param {Set<string>} allowed
 */
function hasOnlyUniqueAllowedIds(ids, allowed) {
  return ids.length <= 3 && ids.every((id, index) => allowed.has(id) && ids.indexOf(id) === index);
}

/** @param {SalesItem} item */
function compactItem(item) {
  return {
    id: item.id,
    name: item.name,
    quantitySold: item.quantitySold,
    revenuePaise: item.revenuePaise,
    lastOrderedAt: item.lastOrderedAt,
    rank: item.rank,
  };
}

/** @param {string} first @param {string} second */
function pairKey(first, second) {
  return [first, second].sort().join("\u0000");
}
