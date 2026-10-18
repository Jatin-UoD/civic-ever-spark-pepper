/** @param {unknown} value */
export function parseContextBody(value) {
  if (!isRecord(value) || typeof value.canteenId !== "string") return null;
  const canteenId = value.canteenId.trim();
  return canteenId && canteenId.length <= 80 ? { canteenId } : null;
}

/** @param {unknown} value @returns {{ id: string, decision: "approved" | "dismissed" } | null} */
export function parseDecisionBody(value) {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const id = value.id.trim();
  const decision = value.decision;
  if (!id || id.length > 80 || (decision !== "approved" && decision !== "dismissed")) return null;
  return { id, decision };
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
