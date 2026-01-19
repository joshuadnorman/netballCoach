import { ScrollView, Text, View, TouchableOpacity, Modal, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { Drill, Session } from "@/lib/types";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MenuIcon, UserIcon } from "@/components/ui/svg-icons";
import { themeColors } from "@/theme.config";

const LS_KEYS = {
  team: "nb_team_name_v2",
  selectedTeam: "nb_selected_team",
  drills: "nb_drills_v2",
  sessions: "nb_sessions_v2",
};

interface TeamData {
  id: string;
  name: string;
  color: string;
}

export default function HomeScreen() {
  const [teamName, setTeamName] = useState("Your Team");
  const [drills, setDrills] = useState<Drill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load team data
      const teamData = await AsyncStorage.getItem(LS_KEYS.selectedTeam);
      if (teamData) {
        const team: TeamData = JSON.parse(teamData);
        setTeamName(team.name);
      } else {
        const name = await AsyncStorage.getItem(LS_KEYS.team);
        if (name) setTeamName(name);
      }

      // Load drills
      const drillsData = await AsyncStorage.getItem(LS_KEYS.drills);
      if (drillsData) setDrills(JSON.parse(drillsData));

      // Load sessions
      const sessionsData = await AsyncStorage.getItem(LS_KEYS.sessions);
      if (sessionsData) setSessions(JSON.parse(sessionsData));
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // Calculate stats
  const totalDrills = drills.length;
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0);

  // Get recent drills (last 3)
  const recentDrills = [...drills].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="p-6 gap-5">
          {/* Header */}
          <View className="bg-header -mx-6 -mt-6 pt-12 pb-6 px-6 rounded-b-[32px] mb-2">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                className="w-10 h-10 items-center justify-center active:opacity-70"
              >
                <MenuIcon size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View className="flex-1 ml-4">
                <Text className="text-white/70 text-sm font-medium">My Team</Text>
                <Text className="text-white text-2xl font-bold tracking-tight">{teamName}</Text>
              </View>
              <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                <UserIcon size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Next Match */}
          <View className="bg-card rounded-3xl p-5 shadow-sm border border-border">
            <Text className="text-foreground font-semibold mb-1">Next Match</Text>
            <Text className="text-muted text-sm mb-1">Saturday, Jan 10</Text>
            <Text className="text-foreground text-lg font-bold">Next opponent TBD</Text>
          </View>

          {/* Today's Focus */}
          <View className="bg-card rounded-3xl p-5 shadow-sm border border-border">
            <Text className="text-foreground font-semibold mb-1">Today's Focus</Text>
            <Text className="text-foreground text-lg font-bold">No focus set for today</Text>
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/today" as any)}
              className="flex-1 bg-primary rounded-2xl py-4 px-4 active:opacity-70 items-center justify-center shadow-sm"
            >
              <Text className="text-white text-center font-bold text-base">+ Create Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/exercises" as any)}
              className="flex-1 rounded-2xl py-4 px-4 active:opacity-70 items-center justify-center shadow-sm"
              style={{ backgroundColor: "hsl(252, 70%, 60%)" }}
            >
              <Text className="text-white text-center font-bold text-base">+ Create Drill</Text>
            </TouchableOpacity>
          </View>

          {/* Week Overview */}
          <View className="bg-card rounded-3xl p-5 shadow-sm border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-foreground font-semibold text-lg">Week Overview</Text>
              <IconSymbol name="calendar" size={20} color={themeColors.foreground.light} />
            </View>
            <View className="gap-2">
              {[
                { day: "MON", color: "hsl(158, 64%, 51%)", label: "Rest", minutes: 0 },
                { day: "TUE", color: "hsl(158, 64%, 51%)", label: "Rest", minutes: 0 },
                { day: "WED", color: "hsl(252, 70%, 60%)", label: "Rest", minutes: 0 },
                { day: "THU", color: "hsl(217, 91%, 60%)", label: "Rest", minutes: 0 },
                { day: "FRI", color: "hsl(82, 77%, 55%)", label: "Rest", minutes: 0 },
                { day: "SAT", color: "hsl(0, 0%, 45%)", label: "Rest", minutes: 0 },
                { day: "SUN", color: "hsl(158, 64%, 51%)", label: "Rest", minutes: 0 },
              ].map((item) => (
                <View key={item.day} className="flex-row items-center gap-3">
                  <Text className="text-foreground font-bold text-sm w-12">{item.day}</Text>
                  <View className="flex-1 rounded-full py-2 px-4 flex-row items-center justify-between" style={{ backgroundColor: item.color }}>
                    <Text className="text-white font-semibold">{item.label}</Text>
                    <Text className="text-white font-semibold">{item.minutes} min</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Drills */}
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-semibold text-lg">Recent Drills</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/exercises" as any)}
                className="active:opacity-70"
              >
                <Text className="text-primary text-sm font-medium">View all</Text>
              </TouchableOpacity>
            </View>

            {recentDrills.length === 0 ? (
              <View className="bg-background rounded-xl p-4 border border-border border-dashed">
                <Text className="text-muted text-center text-sm">
                  No drills yet. Create your first drill in My Exercises!
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {recentDrills.map((drill) => (
                  <TouchableOpacity
                    key={drill.id}
                    onPress={() => router.push("/(tabs)/exercises" as any)}
                    className="bg-background rounded-xl p-3 flex-row items-center justify-between active:opacity-70 border border-border"
                  >
                    <View className="flex-1">
                      <Text className="text-foreground font-medium">{drill.name}</Text>
                      <Text className="text-muted text-xs">{drill.category}</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={themeColors.muted.light} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Upcoming Events */}
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-semibold text-lg">Upcoming Events</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/season" as any)}
                className="active:opacity-70"
              >
                <Text className="text-primary text-sm font-medium">View calendar</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-background rounded-xl p-4 border border-border border-dashed">
              <Text className="text-muted text-center text-sm">
                No upcoming events. Add games and tournaments in Season!
              </Text>
            </View>
          </View>

          {/* Navigate Section */}
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
            <Text className="text-foreground font-semibold mb-3 text-lg">Navigate</Text>
            <View className="gap-2">
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/season" as any)}
                className="bg-background rounded-xl p-4 flex-row items-center active:opacity-70 border border-border"
              >
                <Text className="text-xl mr-3">📅</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">Season Planning</Text>
                  <Text className="text-muted text-xs">View calendar and manage important dates</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={themeColors.muted.light} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/week" as any)}
                className="bg-background rounded-xl p-4 flex-row items-center active:opacity-70 border border-border"
              >
                <Text className="text-xl mr-3">📋</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">Weekly Program</Text>
                  <Text className="text-muted text-xs">Plan your week and share with players</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={themeColors.muted.light} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/stats" as any)}
                className="bg-background rounded-xl p-4 flex-row items-center active:opacity-70 border border-border"
              >
                <Text className="text-xl mr-3">📊</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">Statistics</Text>
                  <Text className="text-muted text-xs">Track training progress and drill usage</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={themeColors.muted.light} />
              </TouchableOpacity>
            </View>
          </View>


        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={menuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <SafeAreaView edges={[]} className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-foreground text-2xl font-bold">Menu</Text>
                <TouchableOpacity
                  onPress={() => setMenuOpen(false)}
                  className="w-8 h-8 items-center justify-center active:opacity-70"
                >
                  <IconSymbol name="xmark" size={24} color={themeColors.foreground.light} />
                </TouchableOpacity>
              </View>

              <View className="gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    router.push("/(tabs)/week" as any);
                  }}
                  className="bg-secondary rounded-2xl py-4 px-6 flex-row items-center active:opacity-90"
                >
                  <IconSymbol name="calendar" size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold text-base ml-3">Week Planner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    router.push("/(tabs)/exercises" as any);
                  }}
                  className="bg-secondary rounded-2xl py-4 px-6 flex-row items-center active:opacity-90"
                >
                  <IconSymbol name="list.bullet.clipboard" size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold text-base ml-3">Create New Drill</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMenuOpen(false)}
                  className="bg-primary rounded-2xl py-4 px-6 items-center active:opacity-90 mt-4"
                >
                  <Text className="text-white font-bold text-base">Close</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
