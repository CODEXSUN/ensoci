import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatSocialDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy h:mm a");
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    twitter: "#1DA1F2",
    linkedin: "#0A66C2",
    tiktok: "#000000",
    youtube: "#FF0000",
    pinterest: "#BD081C"
  };
  return colors[platform] ?? "#6B7280";
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter/X",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    youtube: "YouTube",
    pinterest: "Pinterest"
  };
  return labels[platform] ?? platform;
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter",
    linkedin: "Linkedin",
    tiktok: "Music",
    youtube: "Youtube",
    pinterest: "Image"
  };
  return icons[platform] ?? "Globe";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    expired: "bg-yellow-100 text-yellow-800",
    disconnected: "bg-gray-100 text-gray-800",
    error: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    publishing: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    pending: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800"
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "...";
}

export function countHashtags(content: string): number {
  const matches = content.match(/#\w+/g);
  return matches?.length ?? 0;
}

export function extractHashtags(content: string): string[] {
  return content.match(/#\w+/g) ?? [];
}

export function countMentions(content: string): number {
  const matches = content.match(/@\w+/g);
  return matches?.length ?? 0;
}
