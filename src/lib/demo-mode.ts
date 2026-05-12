/** Modo só interface: login e páginas principais sem PostgreSQL. Ver README e `.env.example`. */
export function isDemoMode(): boolean {
  const v = process.env.DEMO_MODE;
  return v === "1" || v?.toLowerCase() === "true";
}
