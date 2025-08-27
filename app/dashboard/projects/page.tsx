import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Calendar } from "lucide-react"

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

async function getAccessibleProjects(userId: string) {
  const supabase = await createClient()

  // Get user role
  const { data: userData } = await supabase.from("users").select("role").eq("id", userId).single()

  let projects = []

  if (userData?.role === "SUPERVISEUR") {
    // Supervisors can see all projects
    const { data } = await supabase.from("projects").select("*").order("name")
    projects = data || []
  } else {
    // Workers can only see projects they've been assigned to
    const { data: assignments } = await supabase
      .from("assignments")
      .select(`
        projects (*)
      `)
      .eq("user_id", userId)

    // Extract unique projects
    const uniqueProjects = new Map()
    assignments?.forEach((assignment) => {
      if (assignment.projects) {
        uniqueProjects.set(assignment.projects.id, assignment.projects)
      }
    })

    projects = Array.from(uniqueProjects.values())
  }

  return { projects, userRole: userData?.role }
}

export default async function ProjectsPage() {
  const user = await getUserData()
  const { projects, userRole } = await getAccessibleProjects(user.id)

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "EN_COURS":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "FINI":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "ANNULÉ":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "EN_COURS":
        return "En cours"
      case "EN_ATTENTE":
        return "En attente"
      case "FINI":
        return "Terminé"
      case "ANNULÉ":
        return "Annulé"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chantiers</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {userRole === "SUPERVISEUR"
            ? "Tous les chantiers disponibles"
            : "Chantiers sur lesquels vous avez été affecté"}
        </p>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color || "#3B82F6" }} />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <Badge className={getStatusBadgeColor(project.status)}>{getStatusLabel(project.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {project.location}
                </div>

                {(project.start_date || project.end_date) && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <div>
                      {project.start_date && `Début: ${new Date(project.start_date).toLocaleDateString("fr-FR")}`}
                      {project.start_date && project.end_date && " • "}
                      {project.end_date && `Fin: ${new Date(project.end_date).toLocaleDateString("fr-FR")}`}
                    </div>
                  </div>
                )}

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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500">
              {userRole === "SUPERVISEUR"
                ? "Aucun chantier disponible"
                : "Vous n'avez encore été affecté à aucun chantier"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
