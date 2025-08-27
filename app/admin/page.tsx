import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Calendar, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getStats() {
  const supabase = await createClient()

  // Get total users
  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

  // Get present users
  const { count: presentUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("status", "PRÉSENT")

  // Get absent users
  const { count: absentUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("status", "ABSENT")

  // Get active projects
  const { count: activeProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", "EN_COURS")

  // Get today's assignments
  const today = new Date().toISOString().split("T")[0]
  const { count: todayAssignments } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("assignment_date", today)

  return {
    totalUsers: totalUsers || 0,
    presentUsers: presentUsers || 0,
    absentUsers: absentUsers || 0,
    activeProjects: activeProjects || 0,
    todayAssignments: todayAssignments || 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards = [
    {
      title: "Total Employés",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Présents",
      value: stats.presentUsers,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Absents",
      value: stats.absentUsers,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
    {
      title: "Projets Actifs",
      value: stats.activeProjects,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Affectations Aujourd'hui",
      value: stats.todayAssignments,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Administrateur</h1>
        <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de la gestion des chantiers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <Button className="w-full h-20 flex flex-col gap-2 bg-transparent" variant="outline">
                <Users className="h-6 w-6" />
                Gérer les Utilisateurs
              </Button>
            </Link>
            <Link href="/admin/projects">
              <Button className="w-full h-20 flex flex-col gap-2 bg-transparent" variant="outline">
                <Building2 className="h-6 w-6" />
                Gérer les Projets
              </Button>
            </Link>
            <Link href="/admin/calendar">
              <Button className="w-full h-20 flex flex-col gap-2 bg-transparent" variant="outline">
                <Calendar className="h-6 w-6" />
                Planifier les Affectations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
