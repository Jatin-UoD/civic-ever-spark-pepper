import { CanteenError } from "./domain.ts";

/** Free NVIDIA NIM endpoint (OpenAI-compatible). Key from https://build.nvidia.com */
const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

/** Default free Nemotron model on NVIDIA build catalog */
const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";

type MenuSnap = {
  canteen: { name: string; status: string };
  items: { name: string; diet: string; availability: string; basePricePaise: number | null; discountPaise: number }[];
  combos: { name: string; availability: string; pricePaise: number }[];
};

function resolveApiKey(): string | undefined {
  const key =
    process.env.NVIDIA_API_KEY?.trim() ||
    process.env.NGC_API_KEY?.trim() ||
    process.env.NVIDIA_NIM_API_KEY?.trim();
  return key || undefined;
}

export async function askNemotron(menu: MenuSnap, question: string) {
  const key = resolveApiKey();
  if (!key) {
    throw new CanteenError(
      "NO_KEY",
      "NVIDIA is not connected. Add NVIDIA_API_KEY (free key from build.nvidia.com) on the server, then ask again.",
    );
  }
  const model = process.env.NVIDIA_MODEL?.trim() || DEFAULT_MODEL;
  const catalogue = [
    ...menu.items
      .filter((item) => item.availability !== "HIDDEN")
      .slice(0, 60)
      .map((item) => {
        const price =
          item.basePricePaise == null
            ? "price not set"
            : `₹${Math.round((item.basePricePaise - item.discountPaise) / 100)}`;
        return `${item.name} | ${item.diet} | ${item.availability} | ${price}`;
      }),
    ...menu.combos.map(
      (combo) =>
        `${combo.name} | combo | ${combo.availability} | ₹${Math.round(combo.pricePaise / 100)}`,
    ),
  ].join("\n");

  const response = await fetch(NVIDIA_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 220,
      stream: false,
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
        ? "NVIDIA rejected the API key. Get a free key at build.nvidia.com."
        : `NVIDIA Nemotron did not answer (${response.status}). ${detail.slice(0, 180)}`,
    );
  }
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    model?: string;
  };
  const answer = body.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new CanteenError("NEMOTRON", "NVIDIA returned an empty reply.");
  return {
    answer,
    model: body.model || model,
    provider: "NVIDIA NIM (build.nvidia.com)",
  };
}
