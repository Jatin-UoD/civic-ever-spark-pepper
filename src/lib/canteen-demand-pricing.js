/**
 * @typedef {Object} DemandPricingSettings
 * @property {number} moderateDemandPercent
 * @property {number} moderatePricePercent
 * @property {number} highDemandPercent
 * @property {number} highPricePercent
 */

export const DEMAND_PRICE_MAX_INCREASE_PERCENT = 20;

/**
 * @param {number} currentQuantity
 * @param {number} baselineQuantity
 * @returns {number}
 */
export function demandGrowthPercent(currentQuantity, baselineQuantity) {
  if (
    !Number.isFinite(currentQuantity) ||
    !Number.isFinite(baselineQuantity) ||
    currentQuantity < 0 ||
    baselineQuantity <= 0
  ) return 0;
  return Math.max(0, Math.round(((currentQuantity - baselineQuantity) / baselineQuantity) * 100));
}

/**
 * @param {number} growthPercent
 * @param {DemandPricingSettings} settings
 * @returns {number}
 */
export function demandPriceIncreasePercent(growthPercent, settings) {
  validateDemandPricingSettings(settings);
  if (!Number.isFinite(growthPercent) || growthPercent < 0) return 0;
  if (growthPercent >= settings.highDemandPercent) {
    return Math.min(DEMAND_PRICE_MAX_INCREASE_PERCENT, settings.highPricePercent);
  }
  if (growthPercent >= settings.moderateDemandPercent) {
    return Math.min(DEMAND_PRICE_MAX_INCREASE_PERCENT, settings.moderatePricePercent);
  }
  return 0;
}

/**
 * Reject invalid tier values at the shared boundary before persistence or use.
 * @param {DemandPricingSettings} settings
 */
export function validateDemandPricingSettings(settings) {
  const values = Object.values(settings);
  if (
    values.length !== 4 ||
    values.some((value) => !Number.isInteger(value)) ||
    settings.moderateDemandPercent < 1 ||
    settings.moderateDemandPercent > 1000 ||
    settings.highDemandPercent <= settings.moderateDemandPercent ||
    settings.highDemandPercent > 1000 ||
    settings.moderatePricePercent < 0 ||
    settings.moderatePricePercent > DEMAND_PRICE_MAX_INCREASE_PERCENT ||
    settings.highPricePercent < settings.moderatePricePercent ||
    settings.highPricePercent > DEMAND_PRICE_MAX_INCREASE_PERCENT
  ) {
    throw new RangeError("Demand pricing tiers must be ordered and price increases cannot exceed 20%.");
  }
  return settings;
}

/**
 * Apply a validated adjustment to an integer-pa ise base price.
 * @param {number} basePricePaise
 * @param {number} increasePercent
 */
export function adjustedBasePricePaise(basePricePaise, increasePercent) {
  if (!Number.isSafeInteger(basePricePaise) || basePricePaise < 0) {
    throw new RangeError("Base price must be a non-negative integer in paise.");
  }
  if (!Number.isInteger(increasePercent) || increasePercent < 0 || increasePercent > DEMAND_PRICE_MAX_INCREASE_PERCENT) {
    throw new RangeError("Price adjustment must be an integer from 0% to 20%.");
  }
  return Math.round((basePricePaise * (100 + increasePercent)) / 100);
}
