import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { EmployeeSidebar } from "@/components/employee/employee-sidebar"
import { MobileHeader } from "@/components/ui/mobile-header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["OUVRIER", "SUPERVISEUR"]}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="hidden md:block">
          <EmployeeSidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileHeader title="Dashboard" subtitle="Mes affectations" sidebar={<EmployeeSidebar />} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
