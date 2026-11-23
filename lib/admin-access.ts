type AdminEmailConfig = {
  DG_ADMIN_EMAIL?: string;
  DG_ADMIN_EMAILS?: string;
};

/** Match an authenticated email against the owner and optional additional admins. */
export function isAdminEmail(email: string | null | undefined, config: AdminEmailConfig): boolean {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return false;

  return [config.DG_ADMIN_EMAIL, config.DG_ADMIN_EMAILS]
    .flatMap((value) => value?.split(",") ?? [])
    .some((value) => value.trim().toLowerCase() === normalizedEmail);
}
