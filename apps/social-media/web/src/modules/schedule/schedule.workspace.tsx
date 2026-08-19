import { useState } from "react";
import { Button } from "@cxapp/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@cxapp/ui/components/card";
import { Badge } from "@cxapp/ui/components/badge";
import { Calendar } from "@cxapp/ui/components/calendar";
import { Clock, X, AlertCircle } from "lucide-react";
import { useUpcomingSchedules, useSocialSchedules, useScheduleCounts, useScheduleMutations } from "../../hooks.js";
import { getStatusColor, formatSocialDate, getPlatformColor } from "../../utils.js";
import type { SocialSchedule } from "../../types.js";
import { toast } from "sonner";

export function ScheduleWorkspace() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: upcoming = [], isLoading } = useUpcomingSchedules(20);
  const { data: counts } = useScheduleCounts();
  const mutations = useScheduleMutations();

  const handleCancel = async (uuid: string) => {
    if (!confirm("Cancel this scheduled post?")) return;
    await mutations.cancel.mutateAsync(uuid);
    toast.success("Schedule cancelled");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Schedule</h2>
        <p className="text-muted-foreground">View and manage your scheduled posts</p>
      </div>

      {counts && (
        <div className="grid gap-4 md:grid-cols-4">
          {(["pending", "processing", "completed", "failed"] as const).map((status) => (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{counts[status] ?? 0}</div>
                <div className="text-sm text-muted-foreground capitalize">{status}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No scheduled posts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((schedule) => (
                    <div
                      key={schedule.uuid}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-bold">
                            {new Date(schedule.scheduledAt).getDate()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(schedule.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Post #{schedule.postId}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatSocialDate(schedule.scheduledAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(schedule.status)}>{schedule.status}</Badge>
                        {schedule.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(schedule.uuid)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
