/** Gradient avatar giống icon “Gói hiện tại” trên dashboard. */
export function getPlanAvatarClass(plan?: string | null): string {
  const key = (plan ?? 'free').toLowerCase();

  switch (key) {
    case 'monthly':
      return 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25';
    case 'quarterly':
      return 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25';
    case 'yearly':
      return 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25';
    case 'free':
    default:
      return 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25';
  }
}
