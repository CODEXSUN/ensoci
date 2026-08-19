import { useState } from "react";
import { Button } from "@cxapp/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@cxapp/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@cxapp/ui/components/select";
import { Input } from "@cxapp/ui/components/input";
import { Label } from "@cxapp/ui/components/label";
import { Badge } from "@cxapp/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@cxapp/ui/components/card";
import { Plus, Unlink, Trash2, ExternalLink } from "lucide-react";
import { useSocialAccounts, useAccountMutations } from "../../hooks.js";
import { getStatusColor, getPlatformColor, getPlatformLabel, formatSocialDate } from "../../utils.js";
import type { SocialPlatform } from "../../types.js";
import { toast } from "sonner";

const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube", "pinterest"];

export function AccountWorkspace() {
  const [showConnect, setShowConnect] = useState(false);
  const { data: accounts = [], isLoading } = useSocialAccounts();
  const mutations = useAccountMutations();

  const handleConnect = async (platform: SocialPlatform) => {
    try {
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      window.open(
        `/api/social/oauth/${platform}/authorize`,
        `${platform}-oauth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      toast.info(`Connect your ${getPlatformLabel(platform)} account in the popup window`);
      setShowConnect(false);
    } catch (error) {
      toast.error("Failed to initiate connection");
    }
  };

  const handleDisconnect = async (uuid: string, platform: string) => {
    if (!confirm(`Disconnect this ${getPlatformLabel(platform)} account?`)) return;
    await mutations.disconnect.mutateAsync(uuid);
    toast.success("Account disconnected");
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Permanently remove this account?")) return;
    await mutations.delete.mutateAsync(uuid);
    toast.success("Account removed");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Accounts</h2>
          <p className="text-muted-foreground">Manage your connected social media accounts</p>
        </div>
        <Dialog open={showConnect} onOpenChange={setShowConnect}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Social Account</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              {PLATFORMS.map((platform) => (
                <Button
                  key={platform}
                  variant="outline"
                  className="justify-start h-12"
                  onClick={() => handleConnect(platform)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getPlatformColor(platform) }}
                  />
                  <span>{getPlatformLabel(platform)}</span>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg">No accounts connected</p>
              <p className="text-sm mt-1">Connect your social media accounts to start managing them</p>
            </div>
            <Button className="mt-4" onClick={() => setShowConnect(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.uuid}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {account.avatarUrl ? (
                      <img
                        src={account.avatarUrl}
                        alt={account.displayName}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: getPlatformColor(account.platform) }}
                      >
                        {account.displayName[0]}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{account.displayName}</CardTitle>
                      <p className="text-sm text-muted-foreground">@{account.username}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{getPlatformLabel(account.platform)}</span>
                  <span>Connected {formatSocialDate(account.createdAt)}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDisconnect(account.uuid, account.platform)}
                    disabled={account.status !== "active"}
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(account.uuid)}
                  >
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
