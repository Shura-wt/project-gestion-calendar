"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, MapPin, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Project {
  id: string
  name: string
  description: string
  location: string
  status: string
  color: string
  start_date: string
  end_date: string
  waze_link: string
  google_maps_link: string
  created_at: string
}

const PROJECT_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    status: "EN_ATTENTE",
    color: PROJECT_COLORS[0],
    start_date: "",
    end_date: "",
    waze_link: "",
    google_maps_link: "",
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("projects").insert([formData])

      if (error) throw error

      toast({
        title: "Succès",
        description: "Projet créé avec succès",
      })

      setFormData({
        name: "",
        description: "",
        location: "",
        status: "EN_ATTENTE",
        color: PROJECT_COLORS[0],
        start_date: "",
        end_date: "",
        waze_link: "",
        google_maps_link: "",
      })
      setIsCreateDialogOpen(false)
      fetchProjects()
    } catch (error: any) {
      console.error("Error creating project:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase.from("projects").update(updates).eq("id", projectId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Projet mis à jour",
      })
      fetchProjects()
      setEditingProject(null)
    } catch (error: any) {
      console.error("Error updating project:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return

    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Projet supprimé",
      })
      fetchProjects()
    } catch (error: any) {
      console.error("Error deleting project:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      })
    }
  }

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

  const filterProjectsByStatus = (status: string) => {
    return projects.filter((project) => project.status === status)
  }

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <Badge className={getStatusBadgeColor(project.status)}>{getStatusLabel(project.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          {project.location}
        </div>
        {(project.start_date || project.end_date) && (
          <div className="text-sm text-gray-500">
            {project.start_date && `Début: ${new Date(project.start_date).toLocaleDateString("fr-FR")}`}
            {project.start_date && project.end_date && " • "}
            {project.end_date && `Fin: ${new Date(project.end_date).toLocaleDateString("fr-FR")}`}
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
          <Button size="sm" variant="outline" onClick={() => setEditingProject(project)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteProject(project.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading && projects.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Projets</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez vos chantiers et projets</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du projet</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      <SelectItem value="FINI">Terminé</SelectItem>
                      <SelectItem value="ANNULÉ">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Couleur du projet</Label>
                <div className="flex gap-2 mt-2">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? "border-gray-900 dark:border-white" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="waze_link">Lien Waze</Label>
                  <Input
                    id="waze_link"
                    type="url"
                    value={formData.waze_link}
                    onChange={(e) => setFormData({ ...formData, waze_link: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="google_maps_link">Lien Google Maps</Label>
                  <Input
                    id="google_maps_link"
                    type="url"
                    value={formData.google_maps_link}
                    onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Création..." : "Créer le projet"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Tabs */}
      <Tabs defaultValue="EN_COURS" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="EN_COURS">En cours ({filterProjectsByStatus("EN_COURS").length})</TabsTrigger>
          <TabsTrigger value="EN_ATTENTE">En attente ({filterProjectsByStatus("EN_ATTENTE").length})</TabsTrigger>
          <TabsTrigger value="FINI">Terminés ({filterProjectsByStatus("FINI").length})</TabsTrigger>
          <TabsTrigger value="ANNULÉ">Annulés ({filterProjectsByStatus("ANNULÉ").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="EN_COURS" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterProjectsByStatus("EN_COURS").map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="EN_ATTENTE" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterProjectsByStatus("EN_ATTENTE").map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="FINI" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterProjectsByStatus("FINI").map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ANNULÉ" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterProjectsByStatus("ANNULÉ").map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de modification de projet */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateProject(editingProject.id, {
                  name: formData.get("name") as string,
                  description: formData.get("description") as string,
                  location: formData.get("location") as string,
                  status: formData.get("status") as string,
                  start_date: formData.get("start_date") as string,
                  end_date: formData.get("end_date") as string,
                  waze_link: formData.get("waze_link") as string,
                  google_maps_link: formData.get("google_maps_link") as string,
                })
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Nom du projet</Label>
                  <Input id="edit_name" name="name" defaultValue={editingProject.name} required />
                </div>
                <div>
                  <Label htmlFor="edit_status">Statut</Label>
                  <Select name="status" defaultValue={editingProject.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      <SelectItem value="FINI">Terminé</SelectItem>
                      <SelectItem value="ANNULÉ">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea id="edit_description" name="description" defaultValue={editingProject.description} />
              </div>
              <div>
                <Label htmlFor="edit_location">Localisation</Label>
                <Input id="edit_location" name="location" defaultValue={editingProject.location} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_start_date">Date de début</Label>
                  <Input id="edit_start_date" name="start_date" type="date" defaultValue={editingProject.start_date} />
                </div>
                <div>
                  <Label htmlFor="edit_end_date">Date de fin</Label>
                  <Input id="edit_end_date" name="end_date" type="date" defaultValue={editingProject.end_date} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_waze_link">Lien Waze</Label>
                  <Input id="edit_waze_link" name="waze_link" type="url" defaultValue={editingProject.waze_link} />
                </div>
                <div>
                  <Label htmlFor="edit_google_maps_link">Lien Google Maps</Label>
                  <Input
                    id="edit_google_maps_link"
                    name="google_maps_link"
                    type="url"
                    defaultValue={editingProject.google_maps_link}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Sauvegarder
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
