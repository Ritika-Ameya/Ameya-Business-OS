export function formatDate(date?: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function isRenewalThisMonth(date?: string): boolean {
  if (!date) return false;
  const renewal = new Date(date);
  const now = new Date();
  return (
    renewal.getMonth() === now.getMonth() &&
    renewal.getFullYear() === now.getFullYear()
  );
}
