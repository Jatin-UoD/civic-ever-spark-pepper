import { CanteenError } from "./domain.ts";

const DEFAULT_MODEL = "nvidia/Nemotron-3.5-Lightning";

type MenuSnap = {
  canteen: { name: string; status: string };
  items: { name: string; diet: string; availability: string; basePricePaise: number | null; discountPaise: number }[];
  combos: { name: string; availability: string; pricePaise: number }[];
};

export async function askNemotron(menu: MenuSnap, question: string) {
  const key = process.env.NEBIUS_API_KEY?.trim();
  if (!key) {
    throw new CanteenError(
      "NO_KEY",
      "Nebius is not connected. Add NEBIUS_API_KEY on the server, then ask again.",
    );
  }
  const model = process.env.NEBIUS_MODEL?.trim() || DEFAULT_MODEL;
  const catalogue = [
    ...menu.items
      .filter((item) => item.availability !== "HIDDEN")
      .slice(0, 60)
      .map((item) => {
        const price = item.basePricePaise == null ? "price not set" : `₹${Math.round((item.basePricePaise - item.discountPaise) / 100)}`;
        return `${item.name} | ${item.diet} | ${item.availability} | ${price}`;
      }),
    ...menu.combos.map((combo) => `${combo.name} | combo | ${combo.availability} | ₹${Math.round(combo.pricePaise / 100)}`),
  ].join("\n");

  const response = await fetch("https://api.tokenfactory.nebius.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            "You are the counter assistant at a campus canteen. Suggest only dishes from the catalogue. Never invent items or prices. If a dish is UNAVAILABLE, SOLD_OUT, or the canteen is not OPEN, say it cannot be ordered. Keep the reply under 80 words.",
        },
        {
          role: "user",
          content: `Canteen: ${menu.canteen.name} (${menu.canteen.status})\nCatalogue:\n${catalogue}\n\nStudent: ${question}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new CanteenError(
      "NEMOTRON",
      response.status === 401
        ? "Nebius rejected the API key."
        : `Nemotron did not answer (${response.status}). ${detail.slice(0, 180)}`,
    );
  }
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    model?: string;
  };
  const answer = body.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new CanteenError("NEMOTRON", "Nemotron returned an empty reply.");
  return {
    answer,
    model: body.model || model,
    provider: "Nebius Token Factory",
  };
}
