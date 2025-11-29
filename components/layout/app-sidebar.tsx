"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, FolderKanban, Star, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useTeams } from "@/hooks/use-teams"
import { useProjects } from "@/hooks/use-projects"
import type { TeamVMType } from "@/src/schemas/team"

const mainNavItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/teams", label: "팀", icon: Users },
]

function TeamProjects({ team, onNavigate }: { team: TeamVMType; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: projects, isLoading } = useProjects(team.id)

  const activeProjects = projects?.filter((p) => !p.isArchived) || []

  if (isLoading) {
    return (
      <div className="pl-6 space-y-1">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <>
      {activeProjects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`} onClick={onNavigate}>
          <Button
            variant={pathname === `/projects/${project.id}` ? "secondary" : "ghost"}
            className="w-full justify-start text-sm h-8"
          >
            <FolderKanban className="mr-2 h-3 w-3" />
            <span className="truncate">{project.name}</span>
          </Button>
        </Link>
      ))}
    </>
  )
}

function FavoriteProjects({ teams, onNavigate }: { teams: TeamVMType[]; onNavigate?: () => void }) {
  const pathname = usePathname()

  // Get favorite projects from each team
  return (
    <>
      {teams.map((team) => (
        <TeamFavorites key={team.id} teamId={team.id} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </>
  )
}

function TeamFavorites({ teamId, pathname, onNavigate }: { teamId: string; pathname: string; onNavigate?: () => void }) {
  const { data: projects } = useProjects(teamId)
  const favoriteProjects = projects?.filter((p) => p.isFavorite) || []

  return (
    <>
      {favoriteProjects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`} onClick={onNavigate}>
          <Button
            variant={pathname === `/projects/${project.id}` ? "secondary" : "ghost"}
            className="w-full justify-start text-sm"
          >
            <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="truncate">{project.name}</span>
          </Button>
        </Link>
      ))}
    </>
  )
}

// 사이드바 콘텐츠 컴포넌트 (공유)
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: teams, isLoading } = useTeams()

  const handleLinkClick = () => {
    onNavigate?.()
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <nav className="space-y-2">
        {mainNavItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={handleLinkClick}>
            <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start">
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">즐겨찾기</h3>
        <nav className="space-y-1">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </>
          ) : (
            teams && <FavoriteProjects teams={teams} onNavigate={onNavigate} />
          )}
        </nav>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">내 팀</h3>
        <div className="space-y-1">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            teams?.map((team) => (
              <Collapsible key={team.id} defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span className="truncate">{team.name}</span>
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-1">
                  <TeamProjects team={team} onNavigate={onNavigate} />
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

// 데스크톱용 사이드바
export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
      <SidebarContent />
    </aside>
  )
}

// 모바일용 사이드바
export function MobileSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background">
      <SidebarContent onNavigate={onNavigate} />
    </div>
  )
}
