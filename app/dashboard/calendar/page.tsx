"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon, MapPin, Navigation } from "lucide-react"

interface Assignment {
  id: string
  assignment_date: string
  notes: string
  projects: {
    id: string
    name: string
    location: string
    color: string
    waze_link: string
    google_maps_link: string
  }
}

export default function EmployeeCalendar() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchAssignments()
    }
  }, [user, currentDate, view])

  const fetchAssignments = async () => {
    if (!user) return

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

      const { data, error } = await supabase
        .from("assignments")
        .select(`
          *,
          projects (
            id, name, location, color, waze_link, google_maps_link
          )
        `)
        .eq("user_id", user.id)
        .gte("assignment_date", startDate)
        .lte("assignment_date", endDate)
        .order("assignment_date")

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error("Error fetching assignments:", error)
    } finally {
      setLoading(false)
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

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDateObj = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      const dayAssignments = getAssignmentsForDate(currentDateObj)
      const isCurrentMonth = currentDateObj.getMonth() === currentDate.getMonth()
      const isToday = currentDateObj.toDateString() === new Date().toDateString()

      days.push(
        <div
          key={currentDateObj.toISOString()}
          className={`min-h-24 p-2 border border-gray-200 dark:border-gray-700 ${
            isCurrentMonth ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
          } ${isToday ? "ring-2 ring-blue-500" : ""}`}
        >
          <div
            className={`text-sm font-medium mb-1 ${isCurrentMonth ? "text-gray-900 dark:text-white" : "text-gray-400"}`}
          >
            {currentDateObj.getDate()}
          </div>
          <div className="space-y-1">
            {dayAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="text-xs p-1 rounded truncate"
                style={{
                  backgroundColor: assignment.projects.color + "20",
                  color: assignment.projects.color,
                }}
                title={assignment.projects.name}
              >
                {assignment.projects.name}
              </div>
            ))}
          </div>
        </div>,
      )

      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
          <div key={day} className="bg-gray-100 dark:bg-gray-700 p-3 text-center text-sm font-medium">
            {day}
          </div>
        ))}
        {days}
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
      const dayAssignments = getAssignmentsForDate(day)
      const isToday = day.toDateString() === new Date().toDateString()

      days.push(
        <div key={day.toISOString()} className="space-y-4">
          <div
            className={`text-center p-3 rounded-lg ${
              isToday
                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
          >
            <div className="text-sm font-medium">{day.toLocaleDateString("fr-FR", { weekday: "short" })}</div>
            <div className="text-lg font-bold">{day.getDate()}</div>
          </div>
          <div className="space-y-2">
            {dayAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: assignment.projects.color }} />
                  <span className="text-sm font-medium">{assignment.projects.name}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {assignment.projects.location}
                </div>
              </Card>
            ))}
          </div>
        </div>,
      )
    }

    return <div className="grid grid-cols-7 gap-4">{days}</div>
  }

  const renderDayView = () => {
    const dayAssignments = getAssignmentsForDate(currentDate)

    return (
      <div className="space-y-4">
        {dayAssignments.length > 0 ? (
          dayAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: assignment.projects.color }} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.projects.name}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    {assignment.projects.location}
                  </div>

                  {assignment.notes && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Notes:</strong> {assignment.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {assignment.projects.waze_link && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={assignment.projects.waze_link} target="_blank" rel="noopener noreferrer">
                          <Navigation className="h-4 w-4 mr-2" />
                          Ouvrir dans Waze
                        </a>
                      </Button>
                    )}
                    {assignment.projects.google_maps_link && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={assignment.projects.google_maps_link} target="_blank" rel="noopener noreferrer">
                          <MapPin className="h-4 w-4 mr-2" />
                          Ouvrir dans Maps
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune affectation pour cette date</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mon Calendrier</h1>
          <p className="text-gray-600 dark:text-gray-400">Vue de mes affectations personnelles</p>
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

      {/* Navigation */}
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
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </CardContent>
      </Card>
    </div>
  )
}
