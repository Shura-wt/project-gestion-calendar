import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { EmployeeSidebar } from "@/components/employee/employee-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["OUVRIER", "SUPERVISEUR"]}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <EmployeeSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
