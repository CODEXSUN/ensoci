import { useState } from "react";
import { Button } from "@cxapp/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@cxapp/ui/components/dialog";
import { Input } from "@cxapp/ui/components/input";
import { Label } from "@cxapp/ui/components/label";
import { Badge } from "@cxapp/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@cxapp/ui/components/card";
import { Textarea } from "@cxapp/ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@cxapp/ui/components/select";
import { Plus, Edit3, Trash2, Copy, FileText } from "lucide-react";
import { useSocialTemplates, useTemplateMutations } from "../../hooks.js";
import { getPlatformLabel, getPlatformColor, truncateContent } from "../../utils.js";
import type { SocialTemplate, SocialPlatform, PostType } from "../../types.js";
import { toast } from "sonner";

const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube", "pinterest"];
const POST_TYPES: PostType[] = ["text", "image", "video", "link", "carousel", "story", "reel"];

export function TemplateWorkspace() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SocialTemplate | null>(null);
  const { data: templates = [], isLoading } = useSocialTemplates({ search: search || undefined });
  const mutations = useTemplateMutations();

  const handleDelete = async (uuid: string) => {
    if (!confirm("Delete this template?")) return;
    await mutations.delete.mutateAsync(uuid);
    toast.success("Template deleted");
  };

  const handleDuplicate = async (template: SocialTemplate) => {
    await mutations.create.mutateAsync({
      name: `${template.name} (Copy)`,
      description: template.description ?? undefined,
      content: template.content,
      type: template.type,
      platforms: template.platforms,
      tags: template.tags
    });
    toast.success("Template duplicated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="text-muted-foreground">Reusable post templates for quick content creation</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <TemplateForm onDone={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg mt-4">No templates</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create templates to save time on recurring post types
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.uuid}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.isPublic && <Badge variant="secondary">Public</Badge>}
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {truncateContent(template.content, 150)}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{template.type}</Badge>
                  {template.platforms.map((p) => (
                    <div
                      key={p}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getPlatformColor(p) }}
                      title={getPlatformLabel(p)}
                    />
                  ))}
                </div>
                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDuplicate(template)}>
                    <Copy className="h-4 w-4 mr-1" />
                    Use
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(template.uuid)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateForm({ onDone, initial }: { onDone: () => void; initial?: SocialTemplate }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [type, setType] = useState<PostType>(initial?.type ?? "text");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(initial?.platforms ?? []);
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const mutations = useTemplateMutations();

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      toast.error("Name and content are required");
      return;
    }
    if (platforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    if (initial) {
      await mutations.update.mutateAsync({
        uuid: initial.uuid,
        payload: { name, description: description || undefined, content, type, platforms, tags: tagList }
      });
      toast.success("Template updated");
    } else {
      await mutations.create.mutateAsync({ name, description: description || undefined, content, type, platforms, tags: tagList });
      toast.success("Template created");
    }
    onDone();
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit Template" : "New Template"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" />
        </div>

        <div>
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
        </div>

        <div>
          <Label>Content *</Label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Post content..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as PostType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {POST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="marketing, promo" />
          </div>
        </div>

        <div>
          <Label>Platforms *</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {PLATFORMS.map((p) => (
              <Badge
                key={p}
                variant={platforms.includes(p) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setPlatforms(
                    platforms.includes(p)
                      ? platforms.filter((x) => x !== p)
                      : [...platforms, p]
                  );
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: getPlatformColor(p) }}
                />
                {getPlatformLabel(p)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button onClick={handleSubmit}>{initial ? "Update" : "Create"} Template</Button>
      </div>
    </div>
  );
}
