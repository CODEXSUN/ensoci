import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@cxapp/ui/components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@cxapp/ui/components/select";
import { Badge } from "@cxapp/ui/components/badge";
import { TrendingUp, TrendingDown, Eye, Users, Heart, MessageCircle, Share2 } from "lucide-react";
import { useAnalyticsSummary } from "../../hooks.js";
import { getPlatformLabel, getPlatformColor } from "../../utils.js";
import type { SocialPlatform, AnalyticsPeriod, SocialAnalyticsSummary } from "../../types.js";

const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "twitter", "linkedin", "tiktok"];
const PERIODS: AnalyticsPeriod[] = ["day", "week", "month", "quarter", "year"];

function getDateRange(period: AnalyticsPeriod): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from: string;

  switch (period) {
    case "day":
      from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      break;
    case "week":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      break;
    case "month":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      break;
    case "quarter":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      break;
    case "year":
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      break;
  }

  return { from, to };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  change
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  change?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlatformSummaryCard({ summary }: { summary: SocialAnalyticsSummary }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getPlatformColor(summary.platform) }}
          />
          <CardTitle className="text-base">{getPlatformLabel(summary.platform)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Followers</p>
            <p className="text-lg font-bold">{summary.totalFollowers.toLocaleString()}</p>
            {summary.followersGrowth > 0 && (
              <p className="text-xs text-green-600">+{summary.followersGrowth}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Engagement Rate</p>
            <p className="text-lg font-bold">{summary.engagementRate}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Impressions</p>
            <p className="text-lg font-bold">{summary.totalImpressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reach</p>
            <p className="text-lg font-bold">{summary.totalReach.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" /> {summary.totalLikes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> {summary.totalComments}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3 w-3" /> {summary.totalShares}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsWorkspace() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const { from, to } = useMemo(() => getDateRange(period), [period]);
  const { data: summaries = [], isLoading } = useAnalyticsSummary(period, from, to);

  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        impressions: acc.impressions + s.totalImpressions,
        reach: acc.reach + s.totalReach,
        engagement: acc.engagement + s.totalEngagement,
        likes: acc.likes + s.totalLikes,
        comments: acc.comments + s.totalComments,
        shares: acc.shares + s.totalShares,
        followers: acc.followers + s.totalFollowers
      }),
      { impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, followers: 0 }
    );
  }, [summaries]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Track your social media performance</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Eye} label="Impressions" value={totals.impressions} />
        <MetricCard icon={Users} label="Reach" value={totals.reach} />
        <MetricCard icon={Heart} label="Total Engagement" value={totals.engagement} />
        <MetricCard icon={Users} label="Followers" value={totals.followers} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-8 bg-muted rounded w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No analytics data available for this period</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <PlatformSummaryCard key={summary.platform} summary={summary} />
          ))}
        </div>
      )}
    </div>
  );
}
