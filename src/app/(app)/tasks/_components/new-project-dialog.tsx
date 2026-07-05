"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProject } from "@/server/actions/tasks";

export function NewProjectDialog({ type }: { type: "work" | "personal" }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            + New {type} project
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New {type} project</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            startTransition(async () => {
              try {
                await createProject({
                  type,
                  name,
                  description: description || undefined,
                });
                setName("");
                setDescription("");
                setOpen(false);
              } catch {
                toast.error("Couldn't create project.");
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`project-name-${type}`}>Name</Label>
            <Input
              id={`project-name-${type}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`project-description-${type}`}>Description</Label>
            <Textarea
              id={`project-description-${type}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
