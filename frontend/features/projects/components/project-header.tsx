"use client";

import * as React from "react";
import { FolderKanban, PanelLeftClose, PanelLeftOpen, Settings2 } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import type { ProjectItem } from "@/features/projects/types";
import { PageHeaderShell } from "@/components/shared/page-header-shell";
import { cn } from "@/lib/utils";

interface ProjectHeaderProps {
  project?: ProjectItem;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
  onOpenSettings?: () => void;
}

export function ProjectHeader({
  project,
  isDrawerOpen,
  onToggleDrawer,
  onOpenSettings,
}: ProjectHeaderProps) {
  const { t } = useT("translation");

  if (isDrawerOpen) {
    return (
      <div className="flex h-14 min-h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5">
          <FolderKanban className="size-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium text-foreground">
            {project?.name ?? t("project.untitled", "Untitled Project")}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:bg-muted"
            onClick={onOpenSettings}
            aria-label={t("project.settings")}
            title={t("project.settings")}
          >
            <Settings2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:bg-muted"
            onClick={onToggleDrawer}
            aria-label={t("chat.collapse")}
            title={t("chat.collapse")}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageHeaderShell
      className="border-b-0"
      left={
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("-ml-2 gap-2 px-2 text-sm")}
            onClick={onToggleDrawer}
          >
            <PanelLeftOpen className="size-4 shrink-0 text-muted-foreground" />
            <FolderKanban className="size-4 shrink-0 text-primary" />
            <span className="truncate font-medium text-foreground">
              {project?.name ?? t("project.untitled", "Untitled Project")}
            </span>
          </Button>
        </div>
      }
    />
  );
}
