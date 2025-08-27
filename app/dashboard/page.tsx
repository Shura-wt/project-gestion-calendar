import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Building2, Clock, MapPin, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        id, name, location, color
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: assignment.projects?.color || "#3B82F6" }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.projects?.name}</h3>
          </div>
          {showDate && (
            <Badge variant="outline">{new Date(assignment.assignment_date).toLocaleDateString("fr-FR")}</Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            {assignment.projects?.location}
          </div>

          {assignment.notes && <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.notes}</p>}

          <div className="flex gap-2 pt-2">
            {assignment.projects?.waze_link && (
              <Button size="sm" variant="outline" asChild>
                <a href={assignment.projects.waze_link} target="_blank" rel="noopener noreferrer">
                  <Navigation className="h-4 w-4 mr-1" />
                  Waze
                </a>
              </Button>
            )}
            {assignment.projects?.google_maps_link && (
              <Button size="sm" variant="outline" asChild>
                <a href={assignment.projects.google_maps_link} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-4 w-4 mr-1" />
                  Maps
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ProjectCard = ({ project }: { project: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color || "#3B82F6" }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            {project.location}
          </div>

          <div className="flex gap-2 pt-2">
            {project.waze_link && (
              <Button size="sm" variant="outline" asChild>
                <a href={project.waze_link} target="_blank" rel="noopener noreferrer">
                  <Navigation className="h-4 w-4 mr-1" />
                  Waze
                </a>
              </Button>
            )}
            {project.google_maps_link && (
              <Button size="sm" variant="outline" asChild>
                <a href={project.google_maps_link} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-4 w-4 mr-1" />
                  Maps
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mon Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de mes affectations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayAssignments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cette semaine</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.weekAssignments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ce mois</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.monthAssignments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Assignments */}
      {stats.todayAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Mes affectations d'aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.todayAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Mes Affectations</TabsTrigger>
          <TabsTrigger value="projects">Chantiers</TabsTrigger>
          {stats.userRole === "SUPERVISEUR" && <TabsTrigger value="teams">Équipes</TabsTrigger>}
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des affectations</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.allAssignments.length > 0 ? (
                <div className="space-y-4">
                  {stats.allAssignments.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} showDate={true} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune affectation trouvée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chantiers accessibles</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.accessibleProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.accessibleProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucun chantier accessible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {stats.userRole === "SUPERVISEUR" && (
          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des équipes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">Fonctionnalité de gestion d'équipes à venir</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
