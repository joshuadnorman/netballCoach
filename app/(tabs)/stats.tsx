import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Drill, Session, WeekPlan, SeasonEvent, CATEGORIES, Category, DayCategoryPlan } from "@/lib/types";
import { themeColors } from "@/theme.config";

const LS_KEYS = {
  drills: "nb_drills_v2",
  sessions: "nb_sessions_v2",
  weekPlans: "nb_week_plans_v2",
  events: "nb_season_events_v2",
};

type TimeRange = "week" | "month" | "year";

const COLORS = [
  themeColors.primary.light,   // Mint Green
  themeColors.secondary.light, // Violet
  themeColors.blue?.light || "#3B82F6",      // Blue
  themeColors.lime?.light || "#A3E635",      // Lime
  themeColors.warning.light,   // Amber
  themeColors.error.light,     // Red
  themeColors.grey?.light || "#6B7280",      // Grey
  themeColors.header.light,    // Navy
];

interface CategoryStat {
  category: Category | string;
  time: number;
  percentage: number;
}

interface DrillStat {
  id: string;
  name: string;
  count: number;
  minutes: number;
}

export default function StatsScreen() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weekPlans, setWeekPlans] = useState<WeekPlan>({});
  const [events, setEvents] = useState<SeasonEvent[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [drillsData, sessionsData, weekPlansData, eventsData] = await Promise.all([
        AsyncStorage.getItem(LS_KEYS.drills),
        AsyncStorage.getItem(LS_KEYS.sessions),
        AsyncStorage.getItem(LS_KEYS.weekPlans),
        AsyncStorage.getItem(LS_KEYS.events),
      ]);

      if (drillsData) setDrills(JSON.parse(drillsData));
      if (sessionsData) setSessions(JSON.parse(sessionsData));
      if (weekPlansData) setWeekPlans(JSON.parse(weekPlansData));
      if (eventsData) setEvents(JSON.parse(eventsData));
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // Get date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;

    switch (timeRange) {
      case "week":
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        break;
      case "year":
        start = new Date(now);
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { start, end: now };
  }, [timeRange]);

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const sessionDate = new Date(s.dateISO || s.createdAt);
      return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
    });
  }, [sessions, dateRange]);

  // Filter week plans by date range
  const filteredWeekPlans = useMemo(() => {
    const filtered: WeekPlan = {};
    Object.entries(weekPlans).forEach(([dateISO, plan]) => {
      const planDate = new Date(dateISO);
      if (planDate >= dateRange.start && planDate <= dateRange.end) {
        filtered[dateISO] = plan;
      }
    });
    return filtered;
  }, [weekPlans, dateRange]);

  // Filter events by date range
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= dateRange.start && eventDate <= dateRange.end;
    });
  }, [events, dateRange]);

  // Count games and tournaments
  const eventCounts = useMemo(() => {
    const games = filteredEvents.filter((e) => e.type === "game").length;
    const tournaments = filteredEvents.filter((e) => e.type === "tournament").length;
    return { games, tournaments };
  }, [filteredEvents]);

  // Calculate category time from sessions and week plans
  const categoryStats = useMemo(() => {
    const categoryTime: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      categoryTime[cat] = 0;
    });

    // Get time from sessions
    filteredSessions.forEach((session) => {
      (session.blocks || []).forEach((block) => {
        const cat = block.category as string;
        categoryTime[cat] = (categoryTime[cat] || 0) + (block.minutes || 0);
      });
    });

    // Also get time from week plans
    Object.values(filteredWeekPlans).forEach((dayPlan) => {
      if (dayPlan?.categories) {
        Object.entries(dayPlan.categories).forEach(([cat, data]) => {
          const catData = data as DayCategoryPlan;
          categoryTime[cat] = (categoryTime[cat] || 0) + (catData.minutes || 0);
        });
      }
    });

    const totalCategoryTime = Object.values(categoryTime).reduce((sum, time) => sum + time, 0);

    const stats: CategoryStat[] = Object.entries(categoryTime)
      .map(([cat, time]) => ({
        category: cat,
        time: time,
        percentage: totalCategoryTime > 0 ? (time / totalCategoryTime) * 100 : 0,
      }))
      .filter((stat) => stat.time > 0)
      .sort((a, b) => b.time - a.time);

    return stats;
  }, [filteredSessions, filteredWeekPlans]);

  // Calculate drill usage from sessions
  const drillStats = useMemo(() => {
    const drillUsage: Record<string, { count: number; minutes: number }> = {};

    filteredSessions.forEach((session) => {
      (session.blocks || []).forEach((block) => {
        if (block.drillId) {
          if (!drillUsage[block.drillId]) {
            drillUsage[block.drillId] = { count: 0, minutes: 0 };
          }
          drillUsage[block.drillId].count += 1;
          drillUsage[block.drillId].minutes += block.minutes || 0;
        }
      });
    });

    const stats: DrillStat[] = drills
      .map((drill) => ({
        id: drill.id,
        name: drill.name,
        count: drillUsage[drill.id]?.count || 0,
        minutes: drillUsage[drill.id]?.minutes || 0,
      }))
      .filter((stat) => stat.count > 0)
      .sort((a, b) => b.count - a.count);

    return stats;
  }, [drills, filteredSessions]);

  // Calculate totals
  const totalSessions = filteredSessions.length;
  const totalTime = useMemo(() => {
    let time = filteredSessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0);
    // Also add week plan time
    Object.values(filteredWeekPlans).forEach((dayPlan) => {
      if (dayPlan?.categories) {
        Object.values(dayPlan.categories).forEach((data) => {
          const catData = data as DayCategoryPlan;
          time += catData.minutes || 0;
        });
      }
    });
    return time;
  }, [filteredSessions, filteredWeekPlans]);

  const avgMinutesPerSession = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

  const mostUsedCategory = categoryStats[0];
  const leastUsedCategory = categoryStats.length > 1 ? categoryStats[categoryStats.length - 1] : null;
  const mostUsedDrill = drillStats[0];
  const leastUsedDrill = drillStats.length > 1 ? drillStats[drillStats.length - 1] : null;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View>
            <Text className="text-foreground text-3xl font-bold mb-1">Statistics</Text>
            <Text className="text-muted text-sm font-medium">
              Track your training progress and drill usage
            </Text>
          </View>

          {/* Time Range Filter */}
          <View className="flex-row bg-surface rounded-2xl p-1 border border-border shadow-sm">
            {(["week", "month", "year"] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                className={`flex-1 py-2 rounded-xl ${timeRange === range ? "bg-primary" : ""
                  } active:opacity-70`}
              >
                <Text
                  className={`text-center font-medium capitalize ${timeRange === range ? "text-white" : "text-muted"
                    }`}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary Tiles */}
          <View className="flex-row flex-wrap gap-2 justify-between">
            <View className="bg-surface rounded-2xl p-3 border border-border shadow-sm flex-1 min-w-[48%]">
              <Text className="text-muted text-[10px] font-bold uppercase mb-1">Sessions</Text>
              <Text className="text-foreground text-2xl font-bold">{totalSessions}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-3 border border-border shadow-sm flex-1 min-w-[48%]">
              <Text className="text-muted text-[10px] font-bold uppercase mb-1">Minutes</Text>
              <Text className="text-foreground text-2xl font-bold">{totalTime}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-3 border border-border shadow-sm flex-1 min-w-[48%]">
              <Text className="text-muted text-[10px] font-bold uppercase mb-1">Games</Text>
              <Text className="text-foreground text-2xl font-bold">{eventCounts.games}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-3 border border-border shadow-sm flex-1 min-w-[48%]">
              <Text className="text-muted text-[10px] font-bold uppercase mb-1">Tournaments</Text>
              <Text className="text-foreground text-2xl font-bold">{eventCounts.tournaments}</Text>
            </View>
          </View>

          {/* Insights Card */}
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
            <Text className="text-foreground font-semibold mb-3">💡 Insights</Text>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Avg. per session:</Text>
                <Text className="text-foreground font-medium">{avgMinutesPerSession} min</Text>
              </View>

              {mostUsedCategory && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted text-sm">Top focus area:</Text>
                  <View className="bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    <Text className="text-green-600 dark:text-green-400 text-sm" numberOfLines={1}>
                      {mostUsedCategory.category}
                    </Text>
                  </View>
                </View>
              )}

              {leastUsedCategory && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted text-sm">Least focus area:</Text>
                  <View className="bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                    <Text className="text-red-600 dark:text-red-400 text-sm" numberOfLines={1}>
                      {leastUsedCategory.category}
                    </Text>
                  </View>
                </View>
              )}

              {mostUsedDrill && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted text-sm">Most used drill:</Text>
                  <View className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    <Text className="text-blue-600 dark:text-blue-400 text-sm" numberOfLines={1}>
                      {mostUsedDrill.name} ({mostUsedDrill.count}x)
                    </Text>
                  </View>
                </View>
              )}

              {leastUsedDrill && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted text-sm">Least used drill:</Text>
                  <View className="bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    <Text className="text-orange-600 dark:text-orange-400 text-sm" numberOfLines={1}>
                      {leastUsedDrill.name} ({leastUsedDrill.count}x)
                    </Text>
                  </View>
                </View>
              )}

              {!mostUsedCategory && !mostUsedDrill && (
                <Text className="text-muted text-center py-4">
                  No training data yet. Start by creating drills and saving sessions!
                </Text>
              )}
            </View>
          </View>

          {/* Time by Category Chart */}
          {categoryStats.length > 0 && (
            <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <Text className="text-foreground font-semibold mb-4">Time by Category</Text>

              <View className="gap-3">
                {categoryStats.slice(0, 10).map((stat, index) => (
                  <View key={stat.category}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-muted text-sm flex-1" numberOfLines={1}>
                        {stat.category}
                      </Text>
                      <Text className="text-muted text-sm ml-2">
                        {stat.time}m ({stat.percentage.toFixed(0)}%)
                      </Text>
                    </View>
                    <View className="h-4 bg-background rounded-full overflow-hidden border border-border">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${stat.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Drill Usage Chart */}
          {drillStats.length > 0 && (
            <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <Text className="text-foreground font-semibold mb-4">Most Used Drills</Text>

              <View className="gap-3">
                {drillStats.slice(0, 10).map((stat, index) => {
                  const maxCount = drillStats[0].count;
                  const percentage = (stat.count / maxCount) * 100;

                  return (
                    <View key={stat.id}>
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-muted text-sm flex-1" numberOfLines={1}>
                          {stat.name}
                        </Text>
                        <Text className="text-muted text-sm ml-2">{stat.count}x</Text>
                      </View>
                      <View className="h-4 bg-background rounded-full overflow-hidden border border-border">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </View>
                      <Text className="text-muted text-xs mt-0.5">{stat.minutes} min total</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Category Breakdown */}
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
            <Text className="text-foreground font-semibold mb-3">All Categories</Text>
            <View className="gap-2">
              {CATEGORIES.map((cat, index) => {
                const stat = categoryStats.find((s) => s.category === cat);
                const time = stat?.time || 0;

                return (
                  <View key={cat} className="flex-row items-center justify-between py-1">
                    <View className="flex-row items-center gap-2 flex-1">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <Text className="text-muted text-sm" numberOfLines={1}>
                        {cat}
                      </Text>
                    </View>
                    <Text className="text-foreground font-medium">{time} min</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Empty State */}
          {categoryStats.length === 0 && drillStats.length === 0 && (
            <View className="bg-surface rounded-2xl p-8 border border-border shadow-sm">
              <Text className="text-muted text-center text-base">
                No statistics available yet.{"\n\n"}
                Start planning your weeks and building sessions to see your training insights here!
              </Text>
            </View>
          )}

          {/* Notes */}
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
            <Text className="text-foreground font-semibold mb-3">How Stats Work</Text>
            <View className="gap-2">
              <Text className="text-muted text-sm">
                • Session time comes from saved sessions (Today tab)
              </Text>
              <Text className="text-muted text-sm">
                • Category time also includes Week planner data
              </Text>
              <Text className="text-muted text-sm">
                • Games/Tournaments counted from Season calendar
              </Text>
              <Text className="text-muted text-sm">
                • Use time filters to view different periods
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
