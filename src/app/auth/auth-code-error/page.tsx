import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Authentication Error</h1>
      <p className="text-center text-muted-foreground">
        There was a problem authenticating your account. Please try again.
      </p>
      <Button asChild>
        <Link href="/login">Return to Login</Link>
      </Button>
    </div>
  )
} 