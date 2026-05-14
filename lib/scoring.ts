import { Post } from "@prisma/client";

export function calcEngagementRate(post: {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}): number {
  if (post.views === 0) return 0;
  return (post.likes + post.comments + post.shares) / post.views;
}

export function calcHookScore(
  post: { views: number; likes: number; comments: number; shares: number; purchases?: number | null },
  avgViews30d: number
): number {
  const engagementRate = calcEngagementRate(post);
  const viewsScore = avgViews30d > 0 ? (post.views / avgViews30d) * 50 : 0;
  const engScore = engagementRate * 30;
  const purchaseBonus = (post.purchases ?? 0) > 0 ? 20 : 0;
  return Math.round(Math.min(100, viewsScore + engScore + purchaseBonus));
}

export function getWeekday(date: Date): number {
  // 0 = Monday ... 6 = Sunday
  const jsDay = date.getDay(); // 0=Sunday
  return jsDay === 0 ? 6 : jsDay - 1;
}

export type Pattern = {
  dimension: "hook_type" | "topic_category" | "weekday" | "platform" | "duration";
  value: string;
  avg_hook_score: number;
  post_count: number;
  sample_post_title: string;
};

export type OptimalSlot = {
  weekday: number;
  hour: number;
  avg_score: number;
  sample_size: number;
};

const WEEKDAY_NAMES = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export function computePatterns(posts: Post[]): { repeat: Pattern[]; avoid: Pattern[] } {
  if (posts.length < 15) return { repeat: [], avoid: [] };

  const published = posts.filter((p) => p.status === "published");

  function groupBy(keyFn: (p: Post) => string, dim: Pattern["dimension"]): Pattern[] {
    const groups: Record<string, { scores: number[]; bestTitle: string; bestScore: number }> = {};
    for (const p of published) {
      const key = keyFn(p);
      if (!groups[key]) groups[key] = { scores: [], bestTitle: p.title, bestScore: -1 };
      groups[key].scores.push(p.hookScore);
      if (p.hookScore > groups[key].bestScore) {
        groups[key].bestScore = p.hookScore;
        groups[key].bestTitle = p.title;
      }
    }
    return Object.entries(groups).map(([value, g]) => ({
      dimension: dim,
      value,
      avg_hook_score: Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length),
      post_count: g.scores.length,
      sample_post_title: g.bestTitle,
    }));
  }

  const durationBucket = (p: Post) => {
    if (p.durationSeconds <= 30) return "≤30s";
    if (p.durationSeconds <= 60) return "31–60s";
    if (p.durationSeconds <= 180) return "1–3min";
    return ">3min";
  };

  const all: Pattern[] = [
    ...groupBy((p) => p.hookType, "hook_type"),
    ...groupBy((p) => p.topicCategory, "topic_category"),
    ...groupBy((p) => WEEKDAY_NAMES[p.weekday] ?? String(p.weekday), "weekday"),
    ...groupBy((p) => p.platform, "platform"),
    ...groupBy(durationBucket, "duration"),
  ].filter((pat) => pat.post_count >= 2);

  const sorted = [...all].sort((a, b) => b.avg_hook_score - a.avg_hook_score);
  return {
    repeat: sorted.slice(0, 3),
    avoid: [...sorted].reverse().slice(0, 3),
  };
}

export function computeOptimalSlots(posts: Post[]): OptimalSlot[] {
  const published = posts.filter((p) => p.status === "published");
  const groups: Record<string, { scores: number[]; weekday: number; hour: number }> = {};

  for (const p of published) {
    const hour = new Date(p.publishedAt).getHours();
    const key = `${p.weekday}-${hour}`;
    if (!groups[key]) groups[key] = { scores: [], weekday: p.weekday, hour };
    groups[key].scores.push(p.hookScore);
  }

  return Object.values(groups)
    .map((g) => ({
      weekday: g.weekday,
      hour: g.hour,
      avg_score: Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length),
      sample_size: g.scores.length,
    }))
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, 3);
}

export function nextSlotLabel(slot: OptimalSlot): string {
  const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${DAYS[slot.weekday]} ${pad(slot.hour)}:00–${pad(slot.hour + 1)}:00`;
}
