import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas"
import { LeftSidebar } from "@/components/sidebar/LeftSidebar"
import { RightSidebar } from "@/components/sidebar/RightSidebar"
import { Toolbar } from "@/components/canvas/Toolbar"

export default function WorkflowPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0d0d]">
      <LeftSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Toolbar />
        <WorkflowCanvas />
      </div>
      <RightSidebar />
    </div>
  )
}
