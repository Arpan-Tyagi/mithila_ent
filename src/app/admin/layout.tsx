import AdminShell from './AdminShell';
import { requireAdminPage } from '@/lib/dal/session';

// Server-side guard for the whole /admin tree (CLAUDE.md invariant 1, SEC-12).
// The proxy's redirect is routing only; this layout and each server page call
// the DAL, and every admin Server Action calls requireAdmin() itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
