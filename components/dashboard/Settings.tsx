"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Key } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Settings({ initialUsername }: { initialUsername: string }) {
  const [username, setUsername] = useState(initialUsername)
  const [saving, setSaving] = useState(false)

  // password dialog state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const saveUsername = async () => {
    setSaving(true)
    const res = await fetch("/api/settings/username", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
    setSaving(false)
    if (!res.ok) {
      alert("Failed to update username")
    } else {
      alert("Username updated")
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    setChangingPassword(true)
    const res = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    setChangingPassword(false)
    if (!res.ok) {
      const data = await res.json()
      alert("Failed: " + (data.error || "Unknown error"))
    } else {
      alert("Password changed")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Username field */}
      <div className="flex gap-2 items-center">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
        />
        <Button size="icon" onClick={saveUsername} disabled={saving}>
          <Save className="w-5 h-5" />
        </Button>
      </div>

      {/* Password change dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="neutral">
            <Key className="w-4 h-4 mr-2" /> Change Password
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button onClick={changePassword} disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Save New Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}