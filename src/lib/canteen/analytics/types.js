/**
 * @typedef {Object} SalesLine
 * @property {string} orderId
 * @property {string} customerId
 * @property {string} placedAt
 * @property {string|null} itemId
 * @property {string} itemName
 * @property {string} categoryName
 * @property {string|null} categoryId
 * @property {number} quantity
 * @property {number} unitPricePaise
 * @property {string} paymentStatus
 * @property {string} orderStatus
 *
 * @typedef {Object} ItemPerformance
 * @property {string} itemId
 * @property {string} name
 * @property {string} categoryName
 * @property {string} availability
 * @property {number} quantity
 * @property {number} revenuePaise
 * @property {string|null} lastOrderAt
 * @property {number|null} rank
 *
 * @typedef {Object} LowSalesItem
 * @property {string} itemId
 * @property {string} name
 * @property {number} quantity
 * @property {number} revenuePaise
 * @property {string|null} lastOrderAt
 * @property {"no_sales"|"low_sales"} reason
 *
 * @typedef {Object} ComboMetric
 * @property {string} firstItemId
 * @property {string} secondItemId
 * @property {string} firstName
 * @property {string} secondName
 * @property {number} ordersTogether
 * @property {number} orderSharePct
 *
 * @typedef {Object} CategoryMetric
 * @property {string} name
 * @property {number} revenuePaise
 * @property {number} sharePct
 *
 * @typedef {Object} DailyMetric
 * @property {string} date
 * @property {number} revenuePaise
 * @property {number} orders
 *
 * @typedef {Object} PeakHour
 * @property {number} hour
 * @property {number} orders
 *
 * @typedef {Object} PeakDay
 * @property {string} day
 * @property {number} orders
 *
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} name
 * @property {string} categoryName
 * @property {string|null} categoryId
 * @property {string} availability
 *
 * @typedef {Object} KPI
 * @property {number} value
 * @property {number} previous
 * @property {number|null} changePct
 *
 * @typedef {Object} Overview
 * @property {{orders: KPI, revenuePaise: KPI, averageOrderValuePaise: KPI, uniqueCustomers: KPI}} kpis
 * @property {{date: string, revenuePaise: number, orders: number}[]} dailyTrend
 * @property {DailyMetric[]} dailyTrend
 * @property {ItemPerformance[]} itemPerformance
 * @property {LowSalesItem[]} lowSales
 * @property {ComboMetric[]} combos
 * @property {CategoryMetric[]} categories
 * @property {PeakHour[]} peakHours
 * @property {PeakDay[]} peakDays
 * @property {number} totalPaidOrders
 * @property {number} totalRevenuePaise
 */

export const WINDOW_DAYS = 14;
