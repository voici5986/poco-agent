"use client";

import * as React from "react";
import {
  ChevronDown,
  FolderPlus,
  HardDrive,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/features/chat/components/chat/model-selector";
import { useModelCatalog } from "@/features/chat/hooks/use-model-catalog";
import type { ModelSelection } from "@/features/chat/lib/model-catalog";
import type {
  LocalMountAccessMode,
  LocalMountConfig,
} from "@/features/chat/types/api/session";
import {
  createEmptyLocalMountDraftRow,
  toLocalMountDraftRows,
  validateLocalFilesystemDraft,
} from "@/features/task-composer/lib/local-filesystem";
import type { LocalMountDraftRow } from "@/features/task-composer/types/local-filesystem";
import {
  pickLocalDirectory,
  supportsNativeDirectoryPicker,
} from "@/lib/local-directory-picker";

function serializeLocalMounts(mounts: LocalMountConfig[]): string {
  return JSON.stringify(
    mounts.map((mount) => ({
      id: mount.id,
      name: mount.name,
      host_path: mount.host_path,
      access_mode: mount.access_mode ?? "ro",
    })),
  );
}

function hasMeaningfulMountInput(rows: LocalMountDraftRow[]): boolean {
  return rows.some((row) => row.name.trim() || row.host_path.trim());
}

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectDescription?: string | null;
  projectDefaultModel?: string | null;
  projectLocalMounts?: LocalMountConfig[] | null;
  onRename: (
    newName: string,
    newDescription?: string | null,
    defaultModel?: string | null,
    localMounts?: LocalMountConfig[],
  ) => void;
  allowDescriptionEdit?: boolean;
}

export function RenameProjectDialog({
  open,
  onOpenChange,
  projectName,
  projectDescription,
  projectDefaultModel,
  projectLocalMounts,
  onRename,
  allowDescriptionEdit = false,
}: RenameProjectDialogProps) {
  const { t } = useT("translation");
  const { modelOptions, isLoading: isLoadingModelCatalog } = useModelCatalog({
    enabled: open,
  });
  const [name, setName] = React.useState(projectName);
  const [description, setDescription] = React.useState(
    projectDescription ?? "",
  );
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [modelSelection, setModelSelection] =
    React.useState<ModelSelection | null>(null);
  const [mountsEnabled, setMountsEnabled] = React.useState(
    (projectLocalMounts?.length ?? 0) > 0,
  );
  const [mountRows, setMountRows] = React.useState<LocalMountDraftRow[]>(() =>
    toLocalMountDraftRows(projectLocalMounts),
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  const defaultSelection = React.useMemo(() => {
    const defaultOption = modelOptions.find((option) => option.isDefault);
    return defaultOption
      ? {
          modelId: defaultOption.modelId,
          providerId: defaultOption.providerId,
        }
      : null;
  }, [modelOptions]);

  const projectModelSelection = React.useMemo(() => {
    const modelId = (projectDefaultModel || "").trim();
    if (!modelId) {
      return null;
    }
    const matchingOption = modelOptions.find(
      (option) => option.modelId === modelId,
    );
    return {
      modelId,
      providerId: matchingOption?.providerId ?? null,
    };
  }, [modelOptions, projectDefaultModel]);

  React.useEffect(() => {
    setName(projectName);
    setDescription(projectDescription ?? "");
    setModelSelection(projectModelSelection);
    setMountsEnabled((projectLocalMounts?.length ?? 0) > 0);
    setMountRows(toLocalMountDraftRows(projectLocalMounts));
    setAdvancedOpen(false);
  }, [
    projectDescription,
    projectLocalMounts,
    projectModelSelection,
    projectName,
  ]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [open]);

  const handleRowChange = React.useCallback(
    (clientId: string, field: keyof LocalMountDraftRow, nextValue: string) => {
      setMountRows((prev) =>
        prev.map((row) =>
          row.client_id === clientId
            ? {
                ...row,
                [field]: nextValue,
              }
            : row,
        ),
      );
    },
    [],
  );

  const handleAddRow = React.useCallback(() => {
    setMountsEnabled(true);
    setMountRows((prev) => [...prev, createEmptyLocalMountDraftRow()]);
  }, []);

  const handleRemoveRow = React.useCallback((clientId: string) => {
    setMountRows((prev) => {
      const nextRows = prev.filter((row) => row.client_id !== clientId);
      return nextRows.length > 0 ? nextRows : [createEmptyLocalMountDraftRow()];
    });
  }, []);

  const handlePickMountDirectory = React.useCallback(
    async (clientId: string) => {
      if (!supportsNativeDirectoryPicker()) {
        toast.error(t("filesystem.picker.notSupported"));
        return;
      }

      try {
        const pickedDirectory = await pickLocalDirectory();
        if (!pickedDirectory) {
          return;
        }

        setMountRows((prev) =>
          prev.map((row) =>
            row.client_id === clientId
              ? {
                  ...row,
                  name: row.name.trim() || pickedDirectory.displayName,
                  host_path: pickedDirectory.hostPath ?? "",
                }
              : row,
          ),
        );

        if (!pickedDirectory.hostPath) {
          toast.warning(t("filesystem.picker.resolveFailed"));
        }
      } catch {
        // User cancelled the native picker — do nothing
      }
    },
    [t],
  );

  const handleMountToggle = React.useCallback((checked: boolean) => {
    setMountsEnabled(checked);
    if (checked) {
      setMountRows((prev) =>
        hasMeaningfulMountInput(prev) ? prev : [createEmptyLocalMountDraftRow()],
      );
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const validationResult = validateLocalFilesystemDraft(
      mountsEnabled ? "local_mount" : "sandbox",
      mountRows,
      null,
    );
    if (!validationResult.ok || !validationResult.value) {
      toast.error(
        t(
          validationResult.error?.key || "hero.toasts.actionFailed",
          validationResult.error?.values,
        ),
      );
      return;
    }

    const trimmed = name.trim();
    const trimmedDescription = description.trim();
    const currentDescription = projectDescription?.trim() ?? "";
    const currentDefaultModel = projectDefaultModel?.trim() ?? "";
    const nextDescription = trimmedDescription || null;
    const nextDefaultModel = modelSelection?.modelId?.trim() || null;
    const nextLocalMounts = validationResult.value.local_mounts;
    const hasNameChange = trimmed !== projectName;
    const hasDescriptionChange =
      allowDescriptionEdit && trimmedDescription !== currentDescription;
    const hasDefaultModelChange =
      nextDefaultModel !== (currentDefaultModel || null);
    const hasLocalMountChange =
      serializeLocalMounts(nextLocalMounts) !==
      serializeLocalMounts(projectLocalMounts ?? []);

    if (
      !trimmed ||
      (!hasNameChange &&
        !hasDescriptionChange &&
        !hasDefaultModelChange &&
        !hasLocalMountChange)
    ) {
      return;
    }

    if (allowDescriptionEdit) {
      onRename(trimmed, nextDescription, nextDefaultModel, nextLocalMounts);
    } else {
      onRename(trimmed, undefined, nextDefaultModel, nextLocalMounts);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("project.rename")}</DialogTitle>
            <DialogDescription>
              {t("project.renameDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">{t("project.nameLabel")}</Label>
              <Input
                ref={inputRef}
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("project.namePlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onOpenChange(false);
                  }
                }}
              />
            </div>
            {allowDescriptionEdit ? (
              <div className="grid gap-2">
                <Label htmlFor="project-description">
                  {t("project.descriptionLabel")}
                </Label>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("project.detail.descriptionPlaceholder")}
                  rows={4}
                />
              </div>
            ) : null}

            <Collapsible
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              className="rounded-2xl border border-border/60 bg-muted/20"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t("project.advanced.title")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("project.advanced.description")}
                    </p>
                  </div>
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform data-[state=open]:rotate-180"
                    data-state={advancedOpen ? "open" : "closed"}
                  />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="border-t border-border/60 px-4 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project-default-model">
                      {t("project.advanced.defaultModelLabel")}
                    </Label>
                    <div className="flex min-h-10 items-center rounded-xl border border-border bg-background px-1">
                      <Sparkles className="ml-2 size-4 shrink-0 text-muted-foreground" />
                      <ModelSelector
                        options={modelOptions}
                        selection={modelSelection}
                        defaultSelection={defaultSelection}
                        fallbackLabel={
                          projectModelSelection?.modelId ||
                          t("project.advanced.defaultModelPlaceholder")
                        }
                        onChange={setModelSelection}
                        disabled={isLoadingModelCatalog}
                        triggerClassName="h-9 flex-1 justify-between px-2"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Label
                          htmlFor="project-mount-enabled"
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          <HardDrive className="size-4 text-muted-foreground" />
                          {t("project.advanced.mountTitle")}
                        </Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("project.advanced.mountDescription")}
                        </p>
                      </div>
                      <Switch
                        id="project-mount-enabled"
                        checked={mountsEnabled}
                        onCheckedChange={handleMountToggle}
                      />
                    </div>

                    {mountsEnabled ? (
                      <div className="mt-4 grid gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            {t("filesystem.mounts.description")}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRow}
                          >
                            <FolderPlus className="size-4" />
                            {t("filesystem.actions.addMount")}
                          </Button>
                        </div>

                        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                          {mountRows.map((row, index) => (
                            <div
                              key={row.client_id}
                              className="rounded-xl border border-border/60 bg-muted/20 p-3"
                            >
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-foreground">
                                  {t("filesystem.mounts.itemTitle", {
                                    index: index + 1,
                                  })}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground"
                                  onClick={() => handleRemoveRow(row.client_id)}
                                  aria-label={t("filesystem.actions.removeMount")}
                                  title={t("filesystem.actions.removeMount")}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                                <div className="grid gap-2">
                                  <Label htmlFor={`project-mount-name-${row.client_id}`}>
                                    {t("filesystem.fields.name")}
                                  </Label>
                                  <Input
                                    id={`project-mount-name-${row.client_id}`}
                                    value={row.name}
                                    onChange={(event) =>
                                      handleRowChange(
                                        row.client_id,
                                        "name",
                                        event.target.value,
                                      )
                                    }
                                    placeholder={t("filesystem.placeholders.name")}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor={`project-mount-access-${row.client_id}`}>
                                    {t("filesystem.fields.access")}
                                  </Label>
                                  <Select
                                    value={row.access_mode}
                                    onValueChange={(value) =>
                                      handleRowChange(
                                        row.client_id,
                                        "access_mode",
                                        value as LocalMountAccessMode,
                                      )
                                    }
                                  >
                                    <SelectTrigger
                                      id={`project-mount-access-${row.client_id}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ro">
                                        {t("filesystem.accessModes.ro")}
                                      </SelectItem>
                                      <SelectItem value="rw">
                                        {t("filesystem.accessModes.rw")}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-2">
                                <Label htmlFor={`project-mount-path-${row.client_id}`}>
                                  {t("filesystem.fields.path")}
                                </Label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Input
                                    id={`project-mount-path-${row.client_id}`}
                                    value={row.host_path}
                                    onChange={(event) =>
                                      handleRowChange(
                                        row.client_id,
                                        "host_path",
                                        event.target.value,
                                      )
                                    }
                                    placeholder={t("filesystem.placeholders.path")}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={() => {
                                      void handlePickMountDirectory(row.client_id);
                                    }}
                                  >
                                    <FolderPlus className="size-4" />
                                    {t("project.advanced.chooseFolder")}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
