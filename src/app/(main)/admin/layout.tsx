/**
 * Admin Layout
 * 
 * This layout wraps admin routes. The actual admin role protection
 * is handled in middleware.ts to prevent redirect loops.
 * 
 * The middleware checks for admin role before requests reach this layout,
 * so users without admin role are redirected to /admin/unauthorized.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
