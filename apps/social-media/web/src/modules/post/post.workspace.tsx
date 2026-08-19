import { useState, useMemo } from "react";
import { Button } from "@cxapp/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@cxapp/ui/components/dialog";
import { Input } from "@cxapp/ui/components/input";
import { Label } from "@cxapp/ui/components/label";
import { Badge } from "@cxapp/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@cxapp/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@cxapp/ui/components/tabs";
import { Textarea } from "@cxapp/ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@cxapp/ui/components/select";
import { Plus, Send, Clock, Edit3, Trash2, Eye, RotateCcw, AlertCircle, FileText } from "lucide-react";
import { useSocialAccounts, useSocialPosts, usePostSummary, usePostMutations } from "../../hooks.js";
import {
  getStatusColor,
  getPlatformColor,
  getPlatformLabel,
  formatSocialDate,
  truncateContent
} from "../../utils.js";
import type { SocialPost, PostStatus, PostType } from "../../types.js";
import { toast } from "sonner";

const POST_TYPES: PostType[] = ["text", "image", "video", "link", "carousel", "story", "reel"];

export function PostWorkspace() {
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: accounts = [] } = useSocialAccounts();
  const { data: posts = [], isLoading } = useSocialPosts({
    status: filter === "all" ? undefined : filter,
    search: search || undefined
  });
  const { data: summary } = usePostSummary();
  const mutations = usePostMutations();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filter !== "all" && post.status !== filter) return false;
      if (search && !post.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posts, filter, search]);

  const handlePublish = async (uuid: string) => {
    await mutations.publish.mutateAsync(uuid);
    toast.success("Post publishing started");
  };

  const handleCancel = async (uuid: string) => {
    await mutations.cancel.mutateAsync(uuid);
    toast.success("Post cancelled");
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Delete this post?")) return;
    await mutations.delete.mutateAsync(uuid);
    toast.success("Post deleted");
  };

  const openDetail = (post: SocialPost) => {
    setSelectedPost(post);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Posts</h2>
          <p className="text-muted-foreground">Create, schedule, and manage your social media posts</p>
        </div>
        <Dialog open={showComposer} onOpenChange={setShowComposer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <PostComposer accounts={accounts} onDone={() => setShowComposer(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          {(["draft", "scheduled", "publishing", "published", "failed"] as PostStatus[]).map((status) => (
            <Card
              key={status}
              className={`cursor-pointer transition-colors ${filter === status ? "border-primary" : ""}`}
              onClick={() => setFilter(filter === status ? "all" : status)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{summary[status] ?? 0}</div>
                <div className="text-sm text-muted-foreground capitalize">{status}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          {(["all", "draft", "scheduled", "published"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg mt-4">No posts found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different search term" : "Create your first post to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <Card key={post.uuid} className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-4" onClick={() => openDetail(post)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                      <Badge variant="outline">{post.type}</Badge>
                      {post.title && <span className="font-medium">{post.title}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatSocialDate(post.createdAt)}</span>
                      {post.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatSocialDate(post.scheduledAt)}
                        </span>
                      )}
                      <div className="flex gap-1">
                        {post.platforms.map((p) => (
                          <div
                            key={p.id}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getPlatformColor(p.platform) }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                    {post.status === "draft" && (
                      <Button variant="ghost" size="sm" onClick={() => handlePublish(post.uuid)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {post.status === "scheduled" && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(post.uuid)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {post.status === "failed" && (
                      <Button variant="ghost" size="sm" onClick={() => handlePublish(post.uuid)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post.uuid)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {post.failureReason && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {post.failureReason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPost && <PostDetail post={selectedPost} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostComposer({
  accounts,
  onDone
}: {
  accounts: { uuid: string; platform: string; displayName: string }[];
  onDone: () => void;
}) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PostType>("text");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const mutations = usePostMutations();

  const handleSubmit = async (asDraft: boolean) => {
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (selectedAccounts.length === 0) {
      toast.error("Select at least one account");
      return;
    }

    const accountIds = accounts
      .filter((a) => selectedAccounts.includes(a.uuid))
      .map((_, i) => i + 1);

    await mutations.create.mutateAsync({
      title: title || undefined,
      content,
      type,
      accountIds
    });

    toast.success(asDraft ? "Draft saved" : "Post created");
    onDone();
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create New Post</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <Label>Title (optional)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title..." />
        </div>

        <div>
          <Label>Content *</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
        </div>

        <div>
          <Label>Post Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as PostType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POST_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Select Accounts *</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {accounts.map((account) => (
              <label
                key={account.uuid}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                  selectedAccounts.includes(account.uuid)
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedAccounts.includes(account.uuid)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAccounts([...selectedAccounts, account.uuid]);
                    } else {
                      setSelectedAccounts(selectedAccounts.filter((id) => id !== account.uuid));
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getPlatformColor(account.platform) }}
                />
                <span className="text-sm">{account.displayName}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => handleSubmit(true)}>
          Save Draft
        </Button>
        <Button onClick={() => handleSubmit(false)}>
          <Send className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>
    </div>
  );
}

function PostDetail({ post }: { post: SocialPost }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{post.title ?? "Post Detail"}</DialogTitle>
      </DialogHeader>

      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
        <Badge variant="outline">{post.type}</Badge>
      </div>

      <div className="rounded-lg border p-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.media.length > 0 && (
        <div>
          <Label>Media</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {post.media.map((m) => (
              <div key={m.uuid} className="relative rounded border overflow-hidden">
                {m.type === "image" ? (
                  <img src={m.url} alt={m.altText ?? ""} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-muted flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">{m.type}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>Platforms</Label>
        <div className="flex gap-2 mt-2">
          {post.platforms.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getPlatformColor(p.platform) }}
              />
              <span className="text-sm">{getPlatformLabel(p.platform)}</span>
              <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label>Created</Label>
          <p>{formatSocialDate(post.createdAt)}</p>
        </div>
        {post.scheduledAt && (
          <div>
            <Label>Scheduled</Label>
            <p>{formatSocialDate(post.scheduledAt)}</p>
          </div>
        )}
        {post.publishedAt && (
          <div>
            <Label>Published</Label>
            <p>{formatSocialDate(post.publishedAt)}</p>
          </div>
        )}
        <div>
          <Label>Created By</Label>
          <p>{post.createdBy}</p>
        </div>
      </div>
    </div>
  );
}
