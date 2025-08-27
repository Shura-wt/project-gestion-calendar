import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { MobileHeader } from "@/components/ui/mobile-header"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader title="Admin Panel" subtitle="Gestion des chantiers" sidebar={<AdminSidebar />} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
