"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "OUVRIER",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
          },
        },
      })

      if (authError) throw authError

      // The trigger will automatically create the user profile
      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      })

      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "OUVRIER",
      })
      setIsCreateDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase.from("users").update(updates).eq("id", userId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Utilisateur mis à jour",
      })
      fetchUsers()
      setEditingUser(null)
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'utilisateur",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Utilisateur supprimé",
      })
      fetchUsers()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "SUPERVISEUR":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "OUVRIER":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    return status === "PRÉSENT"
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 dark:text-gray-400">Gérez les employés et leurs rôles</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nouvel Utilisateur</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Créer un nouvel utilisateur</p>
                </TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OUVRIER">Ouvrier</SelectItem>
                      <SelectItem value="SUPERVISEUR">Superviseur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Création..." : "Créer l'utilisateur"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Rechercher par nom, prénom ou email</p>
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="SUPERVISEUR">Superviseur</SelectItem>
                  <SelectItem value="OUVRIER">Ouvrier</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PRÉSENT">Présent</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="hidden md:table-cell">Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Date de création</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate max-w-32 sm:max-w-none">
                              {user.first_name} {user.last_name}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs opacity-75">{user.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate max-w-48">{user.email}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Rôle: {user.role}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Statut: {user.status}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{new Date(user.created_at).toLocaleDateString("fr-FR")}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Créé le {new Date(user.created_at).toLocaleString("fr-FR")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 sm:gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-2 sm:px-3 bg-transparent"
                                onClick={() =>
                                  handleUpdateUser(user.id, {
                                    status: user.status === "PRÉSENT" ? "ABSENT" : "PRÉSENT",
                                  })
                                }
                              >
                                <span className="hidden sm:inline">
                                  {user.status === "PRÉSENT" ? "Marquer absent" : "Marquer présent"}
                                </span>
                                <span className="sm:hidden text-xs">
                                  {user.status === "PRÉSENT" ? "Absent" : "Présent"}
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{user.status === "PRÉSENT" ? "Marquer comme absent" : "Marquer comme présent"}</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Modifier l'utilisateur</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprimer l'utilisateur</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier l'utilisateur</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleUpdateUser(editingUser.id, {
                    first_name: formData.get("first_name") as string,
                    last_name: formData.get("last_name") as string,
                    role: formData.get("role") as string,
                  })
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_first_name">Prénom</Label>
                    <Input id="edit_first_name" name="first_name" defaultValue={editingUser.first_name} required />
                  </div>
                  <div>
                    <Label htmlFor="edit_last_name">Nom</Label>
                    <Input id="edit_last_name" name="last_name" defaultValue={editingUser.last_name} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_role">Rôle</Label>
                  <Select name="role" defaultValue={editingUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OUVRIER">Ouvrier</SelectItem>
                      <SelectItem value="SUPERVISEUR">Superviseur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Sauvegarder
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  )
}
