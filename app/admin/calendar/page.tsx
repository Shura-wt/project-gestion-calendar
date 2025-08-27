"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Plus, Users, Search, MapPin, Eye, UserMinus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  first_name: string
  last_name: string
  role: string
  status: string
}

interface Project {
  id: string
  name: string
  color: string
  location: string
}

interface Assignment {
  id: string
  user_id: string
  project_id: string
  assignment_date: string
  notes: string
  users: User
  projects: Project
}

interface ProjectAssignment {
  project: Project
  users: User[]
  assignments: Assignment[]
}

export default function AdminCalendar() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("week")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("PRÉSENT")
  const [draggedUser, setDraggedUser] = useState<User | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const [projectForm, setProjectForm] = useState({
    project_id: "",
    selected_users: [] as string[],
    notes: "",
  })

  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false)
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<{
    project: Project
    assignments: Assignment[]
    date: string
  } | null>(null)
  const [availableUsersForProject, setAvailableUsersForProject] = useState<User[]>([])

  useEffect(() => {
    fetchData()
  }, [currentDate, view])

  const fetchData = async () => {
    try {
      let startDate: string
      let endDate: string

      if (view === "month") {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        startDate = start.toISOString().split("T")[0]
        endDate = end.toISOString().split("T")[0]
      } else if (view === "week") {
        const start = new Date(currentDate)
        start.setDate(currentDate.getDate() - currentDate.getDay())
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        startDate = start.toISOString().split("T")[0]
        endDate = end.toISOString().split("T")[0]
      } else {
        startDate = endDate = currentDate.toISOString().split("T")[0]
      }

      const [assignmentsRes, usersRes, projectsRes] = await Promise.all([
        supabase
          .from("assignments")
          .select(`
            *,
            users!assignments_user_id_fkey (id, first_name, last_name, role, status),
            projects!assignments_project_id_fkey (id, name, color, location)
          `)
          .gte("assignment_date", startDate)
          .lte("assignment_date", endDate)
          .order("assignment_date"),
        supabase.from("users").select("*").order("first_name"),
        supabase.from("projects").select("*").eq("status", "EN_COURS").order("name"),
      ])

      if (assignmentsRes.error) throw assignmentsRes.error
      if (usersRes.error) throw usersRes.error
      if (projectsRes.error) throw projectsRes.error

      setAssignments(assignmentsRes.data || [])
      setUsers(usersRes.data || [])
      setProjects(projectsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProjectAssignments = async (e: React.FormEvent) => {
    e.preventDefault()

    if (projectForm.selected_users.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un employé",
        variant: "destructive",
      })
      return
    }

    try {
      const assignmentsToCreate = projectForm.selected_users.map((userId) => ({
        user_id: userId,
        project_id: projectForm.project_id,
        assignment_date: selectedDate,
        notes: projectForm.notes,
      }))

      const { error } = await supabase.from("assignments").insert(assignmentsToCreate)

      if (error) throw error

      toast({
        title: "Succès",
        description: `${assignmentsToCreate.length} affectation(s) créée(s) avec succès`,
      })

      setProjectForm({ project_id: "", selected_users: [], notes: "" })
      setIsProjectDialogOpen(false)
      fetchData()
    } catch (error: any) {
      console.error("Error creating assignments:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer les affectations",
        variant: "destructive",
      })
    }
  }

  const handleDropUserOnProject = async (user: User, projectId: string, date: string) => {
    try {
      // Vérifier si l'utilisateur est déjà assigné à ce projet ce jour-là
      const existingAssignment = assignments.find(
        (a) => a.user_id === user.id && a.project_id === projectId && a.assignment_date === date,
      )

      if (existingAssignment) {
        toast({
          title: "Information",
          description: "Cet employé est déjà assigné à ce projet",
          variant: "default",
        })
        return
      }

      const { error } = await supabase.from("assignments").insert([
        {
          user_id: user.id,
          project_id: projectId,
          assignment_date: date,
          notes: "",
        },
      ])

      if (error) throw error

      toast({
        title: "Succès",
        description: `${user.first_name} ${user.last_name} ajouté au projet`,
      })

      fetchData()
    } catch (error: any) {
      console.error("Error adding user to project:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'employé au projet",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette affectation ?")) return

    try {
      const { error } = await supabase.from("assignments").delete().eq("id", assignmentId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Affectation supprimée",
      })
      fetchData()
    } catch (error: any) {
      console.error("Error deleting assignment:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'affectation",
        variant: "destructive",
      })
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)

    if (view === "month") {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1))
    } else if (view === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1))
    }

    setCurrentDate(newDate)
  }

  const getDateTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    } else if (view === "week") {
      const start = new Date(currentDate)
      start.setDate(currentDate.getDate() - currentDate.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`
    } else {
      return currentDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }
  }

  const getProjectAssignmentsForDate = (date: Date): ProjectAssignment[] => {
    const dateStr = date.toISOString().split("T")[0]
    const dayAssignments = assignments.filter((assignment) => assignment.assignment_date === dateStr)

    const projectMap = new Map<string, ProjectAssignment>()

    dayAssignments.forEach((assignment) => {
      const projectId = assignment.project_id
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          project: assignment.projects,
          users: [],
          assignments: [],
        })
      }

      const projectAssignment = projectMap.get(projectId)!
      projectAssignment.users.push(assignment.users)
      projectAssignment.assignments.push(assignment)
    })

    return Array.from(projectMap.values())
  }

  const getAvailableUsers = () => {
    return users.filter((user) => {
      const matchesSearch =
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }

  const openProjectDialog = (date: string) => {
    setSelectedDate(date)
    setIsProjectDialogOpen(true)
  }

  const openProjectDetails = (projectAssignment: ProjectAssignment, date: string) => {
    setSelectedProjectDetails({
      project: projectAssignment.project,
      assignments: projectAssignment.assignments,
      date: date,
    })
    setAvailableUsersForProject(getAvailableUsers())
    setIsProjectDetailsOpen(true)
  }

  const handleDragStart = (user: User) => {
    setDraggedUser(user)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, projectId: string, date: string) => {
    e.preventDefault()
    if (draggedUser) {
      handleDropUserOnProject(draggedUser, projectId, date)
      setDraggedUser(null)
    }
  }

  const handleDropOnSidebar = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedUser(null)
  }

  const renderDayView = () => {
    const projectAssignments = getProjectAssignmentsForDate(currentDate)
    const dateStr = currentDate.toISOString().split("T")[0]
    const isToday = currentDate.toDateString() === new Date().toDateString()

    return (
      <div className="space-y-4">
        <div
          className={`text-center p-4 rounded-lg ${
            isToday ? "bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100" : "bg-gray-50 dark:bg-gray-800"
          }`}
        >
          <div className="text-lg font-bold mb-2">
            {currentDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          <Button onClick={() => openProjectDialog(dateStr)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Projet
          </Button>
        </div>

        <div className="space-y-4">
          {projectAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucune affectation pour cette journée</div>
          ) : (
            projectAssignments.map((projectAssignment) => (
              <Card
                key={projectAssignment.project.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, projectAssignment.project.id, dateStr)}
                onClick={() => openProjectDetails(projectAssignment, dateStr)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: projectAssignment.project.color }}
                    />
                    <h3 className="font-semibold text-lg">{projectAssignment.project.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {projectAssignment.project.location}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Eye className="h-4 w-4" />
                    Détails ({projectAssignment.users.length})
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {projectAssignment.users.map((user, index) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteAssignment(projectAssignment.assignments[index].id)
                        }}
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      const projectAssignments = getProjectAssignmentsForDate(day)
      const isToday = day.toDateString() === new Date().toDateString()
      const dateStr = day.toISOString().split("T")[0]

      days.push(
        <div key={day.toISOString()} className="space-y-3">
          <div
            className={`text-center p-3 rounded-lg ${
              isToday
                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                : "bg-gray-50 dark:bg-gray-800"
            }`}
          >
            <div className="text-sm font-medium mb-1">{day.toLocaleDateString("fr-FR", { weekday: "short" })}</div>
            <div className="text-xl font-bold mb-2">{day.getDate()}</div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openProjectDialog(dateStr)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 min-h-40">
            {projectAssignments.map((projectAssignment) => (
              <Card
                key={projectAssignment.project.id}
                className="p-3 hover:shadow-md transition-shadow cursor-pointer group"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, projectAssignment.project.id, dateStr)}
                onClick={() => openProjectDetails(projectAssignment, dateStr)}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: projectAssignment.project.color }}
                    />
                    <div className="font-medium text-sm truncate">{projectAssignment.project.name}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {projectAssignment.users.length}
                  </Badge>
                </div>

                <div className="space-y-1">
                  {projectAssignment.users.slice(0, 3).map((user) => (
                    <div key={user.id} className="text-xs text-gray-600 truncate">
                      {user.first_name} {user.last_name}
                    </div>
                  ))}
                  {projectAssignment.users.length > 3 && (
                    <div className="text-xs text-gray-500">+{projectAssignment.users.length - 3} autres</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>,
      )
    }

    return <div className="grid grid-cols-7 gap-4">{days}</div>
  }

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startOfCalendar = new Date(startOfMonth)
    startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay())

    const days = []
    const today = new Date()

    for (let i = 0; i < 42; i++) {
      const day = new Date(startOfCalendar)
      day.setDate(startOfCalendar.getDate() + i)
      const projectAssignments = getProjectAssignmentsForDate(day)
      const isToday = day.toDateString() === today.toDateString()
      const isCurrentMonth = day.getMonth() === currentDate.getMonth()
      const dateStr = day.toISOString().split("T")[0]

      days.push(
        <div
          key={day.toISOString()}
          className={`min-h-24 p-2 border border-gray-200 dark:border-gray-700 ${
            !isCurrentMonth ? "bg-gray-50 dark:bg-gray-800/50 text-gray-400" : ""
          } ${isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : ""}`}>
              {day.getDate()}
            </span>
            {isCurrentMonth && (
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => openProjectDialog(dateStr)}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="space-y-1">
            {projectAssignments.slice(0, 2).map((projectAssignment) => (
              <div
                key={projectAssignment.project.id}
                className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: `${projectAssignment.project.color}20`,
                  color: projectAssignment.project.color,
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, projectAssignment.project.id, dateStr)}
                onClick={() => openProjectDetails(projectAssignment, dateStr)}
              >
                {projectAssignment.project.name} ({projectAssignment.users.length})
              </div>
            ))}
            {projectAssignments.length > 2 && (
              <div className="text-xs text-gray-500">+{projectAssignments.length - 2} autres</div>
            )}
          </div>
        </div>,
      )
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-0 mb-2">
          {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-700">{days}</div>
      </div>
    )
  }

  const addUserToProject = async (userId: string) => {
    if (!selectedProjectDetails) return

    try {
      const { error } = await supabase.from("assignments").insert([
        {
          user_id: userId,
          project_id: selectedProjectDetails.project.id,
          assignment_date: selectedProjectDetails.date,
          notes: "",
        },
      ])

      if (error) throw error

      const user = users.find((u) => u.id === userId)
      toast({
        title: "Succès",
        description: `${user?.first_name} ${user?.last_name} ajouté au projet`,
      })

      fetchData()
      // Refresh project details
      const updatedAssignments = assignments.filter(
        (a) => a.project_id === selectedProjectDetails.project.id && a.assignment_date === selectedProjectDetails.date,
      )
      setSelectedProjectDetails({
        ...selectedProjectDetails,
        assignments: updatedAssignments,
      })
    } catch (error: any) {
      console.error("Error adding user to project:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'employé au projet",
        variant: "destructive",
      })
    }
  }

  const removeUserFromProject = async (assignmentId: string) => {
    try {
      const { error } = await supabase.from("assignments").delete().eq("id", assignmentId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Employé retiré du projet",
      })

      fetchData()
      // Refresh project details
      if (selectedProjectDetails) {
        const updatedAssignments = selectedProjectDetails.assignments.filter((a) => a.id !== assignmentId)
        setSelectedProjectDetails({
          ...selectedProjectDetails,
          assignments: updatedAssignments,
        })
      }
    } catch (error: any) {
      console.error("Error removing user from project:", error)
      toast({
        title: "Erreur",
        description: "Impossible de retirer l'employé du projet",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendrier de Planification</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les affectations des employés sur les chantiers</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View selector */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            <Button
              size="sm"
              variant={view === "day" ? "default" : "ghost"}
              onClick={() => setView("day")}
              className="rounded-r-none"
            >
              Jour
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "default" : "ghost"}
              onClick={() => setView("week")}
              className="rounded-none border-x border-gray-200 dark:border-gray-700"
            >
              Semaine
            </Button>
            <Button
              size="sm"
              variant={view === "month" ? "default" : "ghost"}
              onClick={() => setView("month")}
              className="rounded-l-none"
            >
              Mois
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Available Users */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employés Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" onDragOver={handleDragOver} onDrop={handleDropOnSidebar}>
              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    size="sm"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="OUVRIER">Ouvrier</SelectItem>
                    <SelectItem value="SUPERVISEUR">Superviseur</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="PRÉSENT">Présent</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getAvailableUsers().map((user) => (
                  <Card
                    key={user.id}
                    className="p-3 hover:shadow-sm transition-shadow cursor-move"
                    draggable
                    onDragStart={() => handleDragStart(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{user.role}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          user.status === "PRÉSENT"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {user.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <CardTitle className="text-xl capitalize">{getDateTitle()}</CardTitle>

                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {view === "day" && renderDayView()}
              {view === "week" && renderWeekView()}
              {view === "month" && renderMonthView()}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isProjectDetailsOpen} onOpenChange={setIsProjectDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedProjectDetails && (
                <>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedProjectDetails.project.color }}
                  />
                  {selectedProjectDetails.project.name}
                  <span className="text-sm font-normal text-gray-500">
                    - {selectedProjectDetails.date && new Date(selectedProjectDetails.date).toLocaleDateString("fr-FR")}
                  </span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Gérez les employés assignés à ce chantier. Vous pouvez ajouter ou supprimer des employés de ce projet.
            </DialogDescription>
          </DialogHeader>

          {selectedProjectDetails && (
            <div className="space-y-6">
              {/* Informations du projet */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{selectedProjectDetails.project.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{selectedProjectDetails.assignments.length} employé(s) assigné(s)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Employés assignés */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Employés assignés</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedProjectDetails.assignments.map((assignment) => (
                      <Card key={assignment.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">
                                {assignment.users.first_name} {assignment.users.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{assignment.users.role}</div>
                              {assignment.notes && <div className="text-xs text-gray-400 mt-1">{assignment.notes}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                assignment.users.status === "PRÉSENT"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {assignment.users.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                              onClick={() => removeUserFromProject(assignment.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {selectedProjectDetails.assignments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">Aucun employé assigné à ce projet</div>
                    )}
                  </div>
                </div>

                {/* Employés disponibles */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Ajouter des employés</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableUsersForProject
                      .filter((user) => !selectedProjectDetails.assignments.some((a) => a.user_id === user.id))
                      .map((user) => (
                        <Card key={user.id} className="p-3 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-medium">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{user.role}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  user.status === "PRÉSENT"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }
                              >
                                {user.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 bg-transparent"
                                onClick={() => addUserToProject(user.id)}
                                disabled={user.status === "ABSENT"}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for creating new project assignments */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Nouveau Projet - {selectedDate && new Date(selectedDate).toLocaleDateString("fr-FR")}
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle affectation de projet en sélectionnant un chantier et les employés à assigner.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProjectAssignments} className="space-y-4">
            <div>
              <Label htmlFor="project_id">Chantier</Label>
              <Select
                value={projectForm.project_id}
                onValueChange={(value) => setProjectForm({ ...projectForm, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        {project.name} - {project.location}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Employés à affecter</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                {getAvailableUsers().map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={projectForm.selected_users.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProjectForm({
                            ...projectForm,
                            selected_users: [...projectForm.selected_users, user.id],
                          })
                        } else {
                          setProjectForm({
                            ...projectForm,
                            selected_users: projectForm.selected_users.filter((id) => id !== user.id),
                          })
                        }
                      }}
                    />
                    <label htmlFor={user.id} className="text-sm font-medium cursor-pointer flex-1">
                      {user.first_name} {user.last_name} ({user.role})
                    </label>
                    <Badge
                      variant="outline"
                      className={
                        user.status === "PRÉSENT"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {projectForm.selected_users.length} employé(s) sélectionné(s)
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={projectForm.notes}
                onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })}
                placeholder="Instructions spéciales, horaires, etc."
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!projectForm.project_id || projectForm.selected_users.length === 0}
            >
              Créer les affectations ({projectForm.selected_users.length})
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
