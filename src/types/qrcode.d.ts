declare module "qrcode" {
  export function toString(
    text: string,
    options: { type: "svg"; margin?: number; color?: { dark?: string; light?: string } },
  ): Promise<string>;
}
