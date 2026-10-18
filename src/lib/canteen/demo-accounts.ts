/** Real email/password accounts seeded into the database. Password is shared. */
export const DEMO_PASSWORD = "SkipTheQueue1";

export const DEMO_ACCOUNTS = [
  { role: "Customer", email: "customer@canteenx.dev", blurb: "Order and track" },
  { role: "Staff", email: "staff@canteenx.dev", blurb: "Queue and live menu" },
  { role: "Canteen admin", email: "canteen@canteenx.dev", blurb: "Prices, staff, analytics" },
  { role: "Institution admin", email: "institution@canteenx.dev", blurb: "Campuses and canteens" },
  { role: "Super admin", email: "super@canteenx.dev", blurb: "Tenants and payments" },
  { role: "Night mess staff", email: "night@canteenx.dev", blurb: "Other tenant only" },
] as const;
