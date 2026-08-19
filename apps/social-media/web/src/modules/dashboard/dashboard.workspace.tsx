import { Card, CardContent, CardHeader, CardTitle } from "@cxapp/ui/components/card";
import { Badge } from "@cxapp/ui/components/badge";
import { Users, FileText, Clock, TrendingUp } from "lucide-react";
import { useSocialAccounts, usePostSummary, useUpcomingSchedules, useAnalyticsSummary } from "../../hooks.js";
import { getPlatformLabel, getPlatformColor, getStatusColor, formatSocialDate, truncateContent } from "../../utils.js";
import type { SocialAnalyticsSummary } from "../../types.js";

function getDateRange() {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return { from, to };
}

export function DashboardWorkspace() {
  const { data: accounts = [] } = useSocialAccounts();
  const { data: summary } = usePostSummary();
  const { data: upcoming = [] } = useUpcomingSchedules(5);
  const { from, to } = getDateRange();
  const { data: analytics = [] } = useAnalyticsSummary("month", from, to);

  const totalPosts = summary ? Object.values(summary).reduce((a, b) => a + b, 0) : 0;
  const totalFollowers = analytics.reduce((a, s) => a + s.totalFollowers, 0);
  const totalEngagement = analytics.reduce((a, s) => a + s.totalEngagement, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Social Media Dashboard</h2>
        <p className="text-muted-foreground">Overview of your social media presence</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Accounts</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{totalPosts}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Followers</p>
                <p className="text-2xl font-bold">{totalFollowers.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Engagement</p>
                <p className="text-2xl font-bold">{totalEngagement.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts connected</p>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.uuid} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPlatformColor(account.platform) }}
                      />
                      <span className="text-sm font-medium">{account.displayName}</span>
                      <span className="text-xs text-muted-foreground">@{account.username}</span>
                    </div>
                    <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming posts</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((schedule) => (
                  <div key={schedule.uuid} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Post #{schedule.postId}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatSocialDate(schedule.scheduledAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Performance (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analytics.map((s: SocialAnalyticsSummary) => (
                <div key={s.platform} className="p-3 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPlatformColor(s.platform) }}
                    />
                    <span className="font-medium">{getPlatformLabel(s.platform)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Followers</span>
                      <p className="font-bold">{s.totalFollowers.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engagement</span>
                      <p className="font-bold">{s.engagementRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
