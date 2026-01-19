import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Share,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { ScreenContainer } from "@/components/screen-container";
import { CATEGORIES, Category, WeekPlan, DayPlan, DayCategoryPlan, SeasonEvent } from "@/lib/types";
import { themeColors } from "@/theme.config";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DropdownPicker } from "@/components/ui/dropdown-picker";

const LS_KEYS = {
  weekPlans: "nb_week_plans_v2",
  team: "nb_team_name_v2",
  selectedTeam: "nb_selected_team",
  seasonEvents: "nb_season_events_v2",
};

const fmtDateISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseISODateLocal = (dateISO: string) => {
  if (!dateISO || typeof dateISO !== "string") return new Date(NaN);
  const parts = dateISO.split("-").map((v) => Number(v));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return new Date(NaN);
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const startOfWeekMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, n: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getDayColor = (dayName: string) => {
  // @ts-ignore - dynamic theme colors
  const colors = themeColors;
  switch (dayName) {
    case "Mon": return colors.primary.light; // Green
    case "Tue": return colors.primary.light; // Green
    case "Wed": return colors.secondary.light; // Purple
    case "Thu": return colors.blue?.light || colors.primary.light; // Blue
    case "Fri": return colors.lime?.light || colors.primary.light; // Lime
    case "Sat": return colors.grey?.light || colors.muted.light; // Grey
    case "Sun": return colors.primary.light; // Green
    default: return colors.primary.light;
  }
};


const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function WeekScreen() {
  const [weekPlans, setWeekPlans] = useState<WeekPlan>({});
  const [teamName, setTeamName] = useState("Your Team");
  const [events, setEvents] = useState<SeasonEvent[]>([]);
  const [selectedWeekStartISO, setSelectedWeekStartISO] = useState(
    fmtDateISO(startOfWeekMonday(new Date()))
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [weekData, teamData, selectedTeamData, eventsData] = await Promise.all([
        AsyncStorage.getItem(LS_KEYS.weekPlans),
        AsyncStorage.getItem(LS_KEYS.team),
        AsyncStorage.getItem(LS_KEYS.selectedTeam),
        AsyncStorage.getItem(LS_KEYS.seasonEvents),
      ]);
      if (weekData) setWeekPlans(JSON.parse(weekData));
      if (selectedTeamData) {
        const team = JSON.parse(selectedTeamData);
        setTeamName(team.name);
      } else if (teamData) {
        setTeamName(teamData);
      }
      if (eventsData) setEvents(JSON.parse(eventsData));
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const saveWeekPlans = async (newPlans: WeekPlan) => {
    try {
      await AsyncStorage.setItem(LS_KEYS.weekPlans, JSON.stringify(newPlans));
      setWeekPlans(newPlans);
    } catch (error) {
      console.error("Failed to save week plans:", error);
    }
  };

  const weekStart = useMemo(() => startOfWeekMonday(parseISODateLocal(selectedWeekStartISO)), [selectedWeekStartISO]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dateISO: fmtDateISO(date),
        dayName: DAY_NAMES[i],
        fullDayName: FULL_DAY_NAMES[i],
      };
    });
  }, [weekStart]);

  const selectedDay = weekDays[selectedDayIndex];
  const selectedDayPlan: DayPlan = weekPlans[selectedDay.dateISO] || {
    categories: {},
    notes: "",
  };

  const updateDayPlan = (updates: Partial<DayPlan>) => {
    const newPlan = { ...selectedDayPlan, ...updates };
    saveWeekPlans({ ...weekPlans, [selectedDay.dateISO]: newPlan });
  };

  const updateCategory = (category: Category, updates: Partial<DayCategoryPlan>) => {
    const currentCat = selectedDayPlan.categories[category] || { minutes: 0, achieved: false, notes: "" };
    const newCategories = {
      ...selectedDayPlan.categories,
      [category]: { ...currentCat, ...updates },
    };
    updateDayPlan({ categories: newCategories });
  };

  const prevWeek = () => {
    const newStart = addDays(weekStart, -7);
    setSelectedWeekStartISO(fmtDateISO(newStart));
  };

  const nextWeek = () => {
    const newStart = addDays(weekStart, 7);
    setSelectedWeekStartISO(fmtDateISO(newStart));
  };

  const jumpToMonth = (monthIndex: number) => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), monthIndex, 1);
    const startOfFirstWeek = startOfWeekMonday(firstOfMonth);
    setSelectedWeekStartISO(fmtDateISO(startOfFirstWeek));
  };

  const currentMonthIndex = weekStart.getMonth();
  const todayMonthIndex = new Date().getMonth();

  const monthOptions = useMemo(() => {
    const options = MONTHS.map((name, index) => ({
      label: name,
      value: String(index),
    }));

    // Move today's month to the front
    const todayOption = options.splice(todayMonthIndex, 1)[0];
    return [todayOption, ...options];
  }, [todayMonthIndex]);

  // Calculate week totals and focus areas
  const weekStats = useMemo(() => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach((c) => (totals[c] = 0));

    weekDays.forEach((day) => {
      const plan = weekPlans[day.dateISO];
      if (plan?.categories) {
        Object.entries(plan.categories).forEach(([cat, data]) => {
          totals[cat] = (totals[cat] || 0) + ((data as DayCategoryPlan).minutes || 0);
        });
      }
    });

    // Get top 2 focus areas
    const sortedCats = Object.entries(totals)
      .filter(([_, mins]) => mins > 0)
      .sort((a, b) => b[1] - a[1]);

    const topFocus = sortedCats.slice(0, 2).map(([cat]) => cat);

    return { totals, topFocus };
  }, [weekPlans, weekDays]);

  // Get upcoming events for this week
  const upcomingEvents = useMemo(() => {
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, weekStart, weekEnd]);

  // Get session themes per day
  const sessionThemes = useMemo(() => {
    const themes: Record<string, string> = {};

    weekDays.forEach((day) => {
      const plan = weekPlans[day.dateISO];
      if (plan?.categories) {
        const activeCats = Object.entries(plan.categories)
          .filter(([_, d]) => (d as DayCategoryPlan).minutes > 0)
          .sort((a, b) => (b[1] as DayCategoryPlan).minutes - (a[1] as DayCategoryPlan).minutes);

        if (activeCats.length > 0) {
          themes[day.dateISO] = activeCats[0][0]; // Top category
        }
      }
    });

    return themes;
  }, [weekPlans, weekDays]);

  // Format date range for display
  const weekRangeDisplay = useMemo(() => {
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const startMonth = weekStart.toLocaleString("default", { month: "short" });
    const endMonth = weekEnd.toLocaleString("default", { month: "short" });

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }, [weekStart, weekEnd]);

  // Generate MENLO WhatsApp share text
  const whatsappShareText = useMemo(() => {
    let text = `🏐 MENLO NETBALL – ${teamName}\n`;
    text += `📆 Weekly Plan: ${weekRangeDisplay}\n\n`;

    // Weekly Focus
    if (weekStats.topFocus.length > 0) {
      text += `🎯 Weekly Focus:\n`;
      weekStats.topFocus.forEach((focus) => {
        text += `• ${focus}\n`;
      });
      text += `\n`;
    }

    // Sessions per day
    const daysWithSessions = weekDays.filter((day) => sessionThemes[day.dateISO]);
    if (daysWithSessions.length > 0) {
      text += `📅 Sessions:\n`;
      daysWithSessions.forEach((day) => {
        text += `${day.fullDayName}: ${sessionThemes[day.dateISO]}\n`;
      });
      text += `\n`;
    }

    // Upcoming events
    if (upcomingEvents.length > 0) {
      text += `🏟 Upcoming:\n`;
      upcomingEvents.forEach((event) => {
        const eventType = event.type.charAt(0).toUpperCase() + event.type.slice(1);
        text += `• ${eventType}: ${event.title} (${event.date})\n`;
      });
      text += `\n`;
    }

    text += `Please arrive on time and ready to work.\n\n`;
    text += `💙 "Streef die hoogtes na"`;

    return text;
  }, [teamName, weekRangeDisplay, weekStats.topFocus, weekDays, sessionThemes, upcomingEvents]);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(whatsappShareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      Alert.alert("Error", "Couldn't copy. Try again.");
    }
  };

  const shareViaWhatsApp = async () => {
    const encodedText = encodeURIComponent(whatsappShareText);
    const whatsappUrl = `whatsapp://send?text=${encodedText}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/?text=${encodedText}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error("Failed to open WhatsApp:", error);
      Alert.alert("WhatsApp not available", "Copy the text instead.");
    }
  };

  const shareWeek = async () => {
    if (Platform.OS === "web") {
      setShareModalOpen(true);
    } else {
      try {
        await Share.share({ message: whatsappShareText });
      } catch (error) {
        console.error("Failed to share:", error);
      }
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-foreground text-xl font-semibold">Week Planning</Text>
              <Text className="text-muted text-sm">Plan focus areas and share with players</Text>
            </View>
            <TouchableOpacity
              onPress={shareWeek}
              className="rounded-xl px-3 py-2 active:opacity-70"
              style={{ backgroundColor: "#25D366" }}
            >
              <Text className="text-white font-medium">📤 Share</Text>
            </TouchableOpacity>
          </View>

          {/* Month Selection */}
          <DropdownPicker
            label="Select Month"
            value={String(currentMonthIndex)}
            options={monthOptions}
            onSelect={(val) => jumpToMonth(parseInt(val))}
            modalTitle="Jump to Month"
            className="mb-4"
          />

          {/* Week Navigation */}
          <View className="flex-row items-center justify-between bg-surface rounded-2xl p-3 border border-border mb-4 shadow-sm">
            <TouchableOpacity onPress={prevWeek} className="p-2 active:opacity-70">
              <IconSymbol name="chevron.left" size={20} color={themeColors.foreground.light} />
            </TouchableOpacity>
            <View className="items-center">
              <Text className="text-foreground font-semibold">{weekRangeDisplay}</Text>
            </View>
            <TouchableOpacity onPress={nextWeek} className="p-2 active:opacity-70">
              <IconSymbol name="chevron.right" size={20} color={themeColors.foreground.light} />
            </TouchableOpacity>
          </View>

          {/* Day Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weekDays.map((day, index) => {
              const isSelected = selectedDayIndex === index;
              return (
                <TouchableOpacity
                  key={day.dateISO}
                  onPress={() => setSelectedDayIndex(index)}
                  className={`px-4 py-2 rounded-full mr-3 border active:opacity-70 ${isSelected ? "border-transparent" : "bg-surface border-border"
                    }`}
                  style={isSelected ? { backgroundColor: getDayColor(day.dayName) } : {}}
                >
                  <Text
                    className={`text-sm font-medium ${isSelected ? "text-white" : "text-foreground"
                      }`}
                  >
                    {day.dayName}
                  </Text>
                  <Text
                    className={`text-xs ${isSelected ? "text-white/80" : "text-muted"
                      }`}
                  >
                    {day.date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Day Content */}
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Day Header */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm">
            <Text className="text-foreground font-semibold mb-2">
              {selectedDay.fullDayName}, {selectedDay.dateISO}
            </Text>

            {/* Notes */}
            <View>
              <Text className="text-muted text-xs mb-1">Day Notes</Text>
              <TextInput
                value={selectedDayPlan.notes || ""}
                onChangeText={(text) => updateDayPlan({ notes: text })}
                placeholder="Add notes for this day..."
                placeholderTextColor={themeColors.muted.light}
                multiline
                numberOfLines={2}
                className="bg-background rounded-xl px-4 py-3 text-foreground border border-border min-h-[80px]"
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Categories */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm">
            <Text className="text-foreground font-semibold mb-3">Focus Areas</Text>

            <View className="gap-2">
              {CATEGORIES.map((category) => {
                const catData = selectedDayPlan.categories[category] || {
                  minutes: 0,
                  achieved: false,
                  notes: "",
                };

                return (
                  <View
                    key={category}
                    className="bg-background rounded-xl p-3 border border-border"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-foreground font-medium flex-1" numberOfLines={1}>
                        {category}
                      </Text>
                      <TouchableOpacity
                        onPress={() => updateCategory(category, { achieved: !catData.achieved })}
                        className={`w-6 h-6 rounded-full items-center justify-center ${catData.achieved ? "bg-green-500" : "bg-surface border border-border"
                          } active:opacity-70`}
                      >
                        {catData.achieved && <Text className="text-white text-xs">✓</Text>}
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Text className="text-muted text-xs">Minutes:</Text>
                      <TextInput
                        value={catData.minutes > 0 ? String(catData.minutes) : ""}
                        onChangeText={(text) =>
                          updateCategory(category, { minutes: parseInt(text) || 0 })
                        }
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={themeColors.muted.light}
                        className="bg-surface rounded-lg px-3 py-2 text-foreground w-20 text-center border border-border font-medium"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Week Summary */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm">
            <Text className="text-foreground font-semibold mb-3">Week Summary</Text>

            {weekStats.topFocus.length > 0 ? (
              <View className="mb-3">
                <Text className="text-muted text-xs mb-2">Top Focus Areas:</Text>
                <View className="flex-row flex-wrap gap-2">
                  {weekStats.topFocus.map((focus) => (
                    <View key={focus} className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      <Text className="text-primary text-sm">{focus}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View className="gap-1">
              {Object.entries(weekStats.totals)
                .filter(([_, mins]) => mins > 0)
                .map(([cat, mins]) => (
                  <View key={cat} className="flex-row items-center justify-between py-1">
                    <Text className="text-muted text-sm">{cat}</Text>
                    <Text className="text-foreground font-medium">{mins} min</Text>
                  </View>
                ))}

              {Object.values(weekStats.totals).every((v) => v === 0) && (
                <Text className="text-muted text-sm text-center py-2">
                  No activities planned this week yet.
                </Text>
              )}
            </View>
          </View>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <Text className="text-foreground font-semibold mb-3">This Week's Events</Text>
              <View className="gap-2">
                {upcomingEvents.map((event) => (
                  <View key={event.id} className="bg-background rounded-xl p-3 border border-border">
                    <Text className="text-foreground font-medium">{event.title}</Text>
                    <Text className="text-muted text-xs">
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)} • {event.date}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Share Modal (Web) */}
      <Modal
        visible={shareModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShareModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[80%]">
            <SafeAreaView edges={[]} className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-foreground text-2xl font-bold">Share Weekly Plan</Text>
                <TouchableOpacity
                  onPress={() => setShareModalOpen(false)}
                  className="w-8 h-8 items-center justify-center active:opacity-70"
                >
                  <IconSymbol name="xmark" size={24} color={themeColors.foreground.light} />
                </TouchableOpacity>
              </View>

              <ScrollView className="mb-6 max-h-80">
                <View className="bg-background rounded-2xl p-5 border border-border shadow-sm">
                  <Text className="text-foreground text-sm leading-relaxed">{whatsappShareText}</Text>
                </View>
              </ScrollView>

              <View className="gap-3">
                <TouchableOpacity
                  onPress={copyToClipboard}
                  className={`rounded-2xl py-4 active:opacity-90 border border-border shadow-sm ${copySuccess ? "bg-green-500 border-green-500" : "bg-background"
                    }`}
                >
                  <Text className={`font-bold text-center text-base ${copySuccess ? "text-white" : "text-foreground"}`}>
                    {copySuccess ? "✓ Copied!" : "📋 Copy to Clipboard"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={shareViaWhatsApp}
                  className="rounded-2xl py-4 active:opacity-90 shadow-md"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <Text className="text-white font-bold text-center text-base">
                    📱 Share via WhatsApp
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShareModalOpen(false)}
                  className="bg-primary rounded-2xl py-4 active:opacity-70 mt-2"
                >
                  <Text className="text-white font-semibold text-center">Close</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
