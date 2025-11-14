import { Separator } from "@/components/ui/separator"

import { AppSidebar } from "@/components/admin/Layouts/Includes/app-sidebar"
import {
  SidebarInset,
} from "@/components/ui/sidebar"


export default function AdminSidebar({ onTabOpen }) {
  return (
    <>
      <AppSidebar onTabOpen={onTabOpen} />
      <SidebarInset>
        <Separator orientation="vertical" className="" />
      </SidebarInset>
    </>
  )
}

