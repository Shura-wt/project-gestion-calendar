"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Plus, Users, Search, X } from "lucide-react"
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

export default function AdminCalendar() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("week")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("PRÉSENT")
  const { toast } = useToast()
  const supabase = createClient()

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    user_id: "",
    project_id: "",
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [currentDate, view])

  const fetchData = async () => {
    try {
      // Fetch assignments for current period
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Check if user is already assigned on this date
      const { data: existingAssignment } = await supabase
        .from("assignments")
        .select("id")
        .eq("user_id", assignmentForm.user_id)
        .eq("assignment_date", selectedDate)
        .single()

      if (existingAssignment) {
        toast({
          title: "Erreur",
          description: "Cet employé est déjà affecté à un chantier ce jour-là",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("assignments").insert([
        {
          user_id: assignmentForm.user_id,
          project_id: assignmentForm.project_id,
          assignment_date: selectedDate,
          notes: assignmentForm.notes,
        },
      ])

      if (error) throw error

      toast({
        title: "Succès",
        description: "Affectation créée avec succès",
      })

      setAssignmentForm({ user_id: "", project_id: "", notes: "" })
      setIsAssignDialogOpen(false)
      fetchData()
    } catch (error: any) {
      console.error("Error creating assignment:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer l'affectation",
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

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return assignments.filter((assignment) => assignment.assignment_date === dateStr)
  }

  const getAvailableUsers = () => {
    return users.filter((user) => {
      const matchesSearch =
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter

      // Check if user is already assigned on selected date
      const isAssigned = assignments.some(
        (assignment) => assignment.user_id === user.id && assignment.assignment_date === selectedDate,
      )

      return matchesSearch && matchesRole && matchesStatus && !isAssigned
    })
  }

  const openAssignDialog = (date: string) => {
    setSelectedDate(date)
    setIsAssignDialogOpen(true)
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      const dayAssignments = getAssignmentsForDate(day)
      const isToday = day.toDateString() === new Date().toDateString()
      const dateStr = day.toISOString().split("T")[0]

      days.push(
        <div key={day.toISOString()} className="space-y-2">
          <div
            className={`text-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isToday
                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                : "bg-gray-50 dark:bg-gray-800"
            }`}
            onClick={() => openAssignDialog(dateStr)}
          >
            <div className="text-sm font-medium">{day.toLocaleDateString("fr-FR", { weekday: "short" })}</div>
            <div className="text-lg font-bold">{day.getDate()}</div>
            <Button size="sm" variant="ghost" className="mt-1 h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-1 min-h-32">
            {dayAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-2 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: assignment.projects.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{assignment.projects.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {assignment.users.first_name} {assignment.users.last_name}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteAssignment(assignment.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>,
      )
    }

    return <div className="grid grid-cols-7 gap-4">{days}</div>
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
            <CardContent className="space-y-4">
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
                  <Card key={user.id} className="p-3 hover:shadow-sm transition-shadow cursor-move">
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

            <CardContent>{view === "week" && renderWeekView()}</CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nouvelle Affectation - {selectedDate && new Date(selectedDate).toLocaleDateString("fr-FR")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <Label htmlFor="user_id">Employé</Label>
              <Select
                value={assignmentForm.user_id}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsers().map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project_id">Chantier</Label>
              <Select
                value={assignmentForm.project_id}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                placeholder="Instructions spéciales, horaires, etc."
              />
            </div>

            <Button type="submit" className="w-full" disabled={!assignmentForm.user_id || !assignmentForm.project_id}>
              Créer l'affectation
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
