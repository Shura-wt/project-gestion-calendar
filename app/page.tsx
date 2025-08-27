import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to login as this is an internal app
  redirect("/login")
}
