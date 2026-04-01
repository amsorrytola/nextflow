import { UserButton } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute top-2 right-[296px] z-50 flex items-center gap-2">
        <span className="text-xs text-[#6b7280]">
          {user.emailAddresses[0]?.emailAddress}
        </span>
        <UserButton
          appearance={{
            elements: { avatarBox: "w-7 h-7" },
          }}
        />
      </div>
      {children}
    </div>
  )
}
