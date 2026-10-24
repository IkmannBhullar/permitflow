import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { logout } from "../actions"

export function LogoutButton(props: React.ComponentProps<typeof Button>) {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" {...props}>
        <LogOutIcon /> Log out
      </Button>
    </form>
  )
}
