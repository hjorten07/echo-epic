import { useState } from "react";
import { Loader2, Plus, Trash2, Edit2, Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GameTheme {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export const AdminThemesTab = () => {
  const queryClient = useQueryClient();
  const [newTheme, setNewTheme] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const { data: themes, isLoading } = useQuery({
    queryKey: ["game-themes-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_themes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GameTheme[];
    },
  });

  const createTheme = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("game_themes")
        .insert({ name: newTheme.name, description: newTheme.description || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-themes-admin"] });
      setNewTheme({ name: "", description: "" });
      toast.success("Theme created!");
    },
    onError: () => toast.error("Failed to create theme"),
  });

  const updateTheme = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GameTheme> }) => {
      const { error } = await supabase
        .from("game_themes")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-themes-admin"] });
      setEditingId(null);
      toast.success("Theme updated!");
    },
    onError: () => toast.error("Failed to update theme"),
  });

  const deleteTheme = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("game_themes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-themes-admin"] });
      toast.success("Theme deleted!");
    },
    onError: () => toast.error("Failed to delete theme"),
  });

  const startEdit = (theme: GameTheme) => {
    setEditingId(theme.id);
    setEditForm({ name: theme.name, description: theme.description || "" });
  };

  const saveEdit = () => {
    if (!editingId || !editForm.name.trim()) return;
    updateTheme.mutate({
      id: editingId,
      updates: { name: editForm.name, description: editForm.description || null },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Song Rush Themes</h2>
      <p className="text-muted-foreground">
        Manage themes for Song Rush game rounds
      </p>

      {/* Add new theme */}
      <div className="glass-card rounded-xl p-6 max-w-xl space-y-4">
        <h3 className="font-semibold">Add New Theme</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="theme-name">Theme Name *</Label>
            <Input
              id="theme-name"
              value={newTheme.name}
              onChange={(e) => setNewTheme((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Summer Hits"
            />
          </div>
          <div>
            <Label htmlFor="theme-desc">Description</Label>
            <Textarea
              id="theme-desc"
              value={newTheme.description}
              onChange={(e) => setNewTheme((p) => ({ ...p, description: e.target.value }))}
              placeholder="Find the best summer song"
              rows={2}
            />
          </div>
          <Button
            onClick={() => createTheme.mutate()}
            disabled={!newTheme.name.trim() || createTheme.isPending}
          >
            {createTheme.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Theme
          </Button>
        </div>
      </div>

      {/* Theme list */}
      {themes && themes.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold">All Themes ({themes.length})</h3>
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={cn(
                "glass-card rounded-xl p-4 flex items-center gap-4",
                !theme.is_active && "opacity-60"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>

              {editingId === theme.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Theme name"
                  />
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={updateTheme.isPending}>
                      <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-semibold">{theme.name}</p>
                    {theme.description && (
                      <p className="text-sm text-muted-foreground">{theme.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${theme.id}`} className="text-xs text-muted-foreground">
                        Active
                      </Label>
                      <Switch
                        id={`active-${theme.id}`}
                        checked={theme.is_active}
                        onCheckedChange={(checked) =>
                          updateTheme.mutate({ id: theme.id, updates: { is_active: checked } })
                        }
                      />
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => startEdit(theme)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete theme "${theme.name}"?`)) {
                          deleteTheme.mutate(theme.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-8 text-center">
          <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No themes configured</p>
        </div>
      )}
    </div>
  );
};
