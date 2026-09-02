export const DEFAULT_CBC_USD = 25;

export type CbcQuote = {
  symbol?: string;
  name?: string;
  source?: "admin" | "cbrilliance" | string;
  admin_can_edit?: boolean;
  api_configured?: boolean;
  api_error?: string | null;
  cbc_usd: number;
  usd_ngn: number | null;
  cbc_ngn: number | null;
  updated_at?: string | null;
};

export function nairaToCbc(naira: number, quote: CbcQuote | null | undefined): number {
  const perCbc = Number(quote?.cbc_ngn || 0);
  const amount = Number(naira);
  if (!(perCbc > 0) || !Number.isFinite(amount)) return 0;
  return amount / perCbc;
}

export function cbcToNaira(cbc: number, quote: CbcQuote | null | undefined): number {
  const perCbc = Number(quote?.cbc_ngn || 0);
  const amount = Number(cbc);
  if (!(perCbc > 0) || !Number.isFinite(amount)) return 0;
  return amount * perCbc;
}

export function quoteFromInputs(cbcUsd: number, usdNgn: number | null): CbcQuote {
  const usd = Number(cbcUsd) > 0 ? Number(cbcUsd) : DEFAULT_CBC_USD;
  const ngn = Number(usdNgn) > 0 ? Number(usdNgn) : null;
  return {
    source: "admin",
    admin_can_edit: true,
    cbc_usd: usd,
    usd_ngn: ngn,
    cbc_ngn: usd && ngn ? usd * ngn : null,
  };
}
