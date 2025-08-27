import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Building2, Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NavigationButtons } from "@/components/ui/navigation-buttons"

async function getUserData() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/login")
  }

  return user
}

async function getEmployeeStats(userId: string) {
  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const weekStart = startOfWeek.toISOString().split("T")[0]

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const monthStart = startOfMonth.toISOString().split("T")[0]

  // Today's assignments
  const { data: todayAssignments } = await supabase
    .from("assignments")
    .select(`
      *,
      projects (
        id, name, location, color, waze_link, google_maps_link
      )
    `)
    .eq("user_id", userId)
    .eq("assignment_date", today)

  // This week's assignments
  const { data: weekAssignments } = await supabase
    .from("assignments")
    .select(`
      *,
      projects (
        id, name, location, color
      )
    `)
    .eq("user_id", userId)
    .gte("assignment_date", weekStart)

  // This month's assignments
  const { data: monthAssignments } = await supabase
    .from("assignments")
    .select(`
      *,
      projects (
        id, name, location, color, waze_link, google_maps_link
      )
    `)
    .eq("user_id", userId)
    .gte("assignment_date", monthStart)

  // All user's assignments (chronological)
  const { data: allAssignments } = await supabase
    .from("assignments")
    .select(`
      *,
      projects (
        id, name, location, color, waze_link, google_maps_link
      )
    `)
    .eq("user_id", userId)
    .order("assignment_date", { ascending: false })
    .limit(10)

  // Accessible projects (for supervisors, show all; for workers, show only assigned ones)
  const { data: userData } = await supabase.from("users").select("role").eq("id", userId).single()

  let accessibleProjects = []
  if (userData?.role === "SUPERVISEUR") {
    const { data: projects } = await supabase.from("projects").select("*").order("name")
    accessibleProjects = projects || []
  } else {
    // For workers, show only projects they've been assigned to
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .in("id", [...new Set((allAssignments || []).map((a) => a.projects?.id).filter(Boolean))])
      .order("name")
    accessibleProjects = projects || []
  }

  return {
    todayAssignments: todayAssignments || [],
    weekAssignments: weekAssignments || [],
    monthAssignments: monthAssignments || [],
    allAssignments: allAssignments || [],
    accessibleProjects,
    userRole: userData?.role,
  }
}

export default async function EmployeeDashboard() {
  const user = await getUserData()
  const stats = await getEmployeeStats(user.id)

  const AssignmentCard = ({ assignment, showDate = false }: { assignment: any; showDate?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: assignment.projects?.color || "#3B82F6" }}
            />
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
              {assignment.projects?.name}
            </h3>
          </div>
          {showDate && (
            <Badge variant="outline" className="text-xs self-start sm:self-auto">
              {new Date(assignment.assignment_date).toLocaleDateString("fr-FR")}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
            <span className="break-words">{assignment.projects?.location}</span>
          </div>

          {assignment.notes && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{assignment.notes}</p>
          )}

          <div className="pt-2">
            <NavigationButtons address={assignment.projects?.location || ""} className="flex-wrap" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ProjectCard = ({ project }: { project: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div
            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color || "#3B82F6" }}
          />
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{project.name}</h3>
        </div>

        <div className="space-y-2">
          {project.description && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{project.description}</p>
          )}

          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
            <span className="break-words">{project.location}</span>
          </div>

          <div className="pt-2">
            <NavigationButtons address={project.location || ""} className="flex-wrap" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Mon Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Vue d'ensemble de mes affectations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Aujourd'hui</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.todayAssignments.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Cette semaine</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.weekAssignments.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-100 dark:bg-green-900/20 flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Ce mois</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.monthAssignments.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-100 dark:bg-purple-900/20 flex-shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Assignments */}
      {stats.todayAssignments.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Mes affectations d'aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {stats.todayAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto">
          <TabsTrigger value="assignments" className="text-xs sm:text-sm px-2 py-2">
            Mes Affectations
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs sm:text-sm px-2 py-2">
            Chantiers
          </TabsTrigger>
          {stats.userRole === "SUPERVISEUR" && (
            <TabsTrigger value="teams" className="text-xs sm:text-sm px-2 py-2 col-span-2 sm:col-span-1">
              Équipes
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Historique des affectations</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {stats.allAssignments.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {stats.allAssignments.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} showDate={true} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                  Aucune affectation trouvée
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Chantiers accessibles</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {stats.accessibleProjects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {stats.accessibleProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">Aucun chantier accessible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {stats.userRole === "SUPERVISEUR" && (
          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Gestion des équipes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                  Fonctionnalité de gestion d'équipes à venir
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
