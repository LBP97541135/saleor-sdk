export const SALEOR_HEALTH_PATH = "/api/health";

export type SaleorHealthProbe = {
  status: "ok" | "degraded";
  version: string;
};
