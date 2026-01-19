import { ScrollView, Text, View, TextInput, TouchableOpacity, Alert, Share } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { ScreenContainer } from "@/components/screen-container";
import { MenuIcon, UserIcon } from "@/components/ui/svg-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { themeColors } from "@/theme.config";

const LS_KEYS = {
    team: "nb_team_name_v2",
    selectedTeam: "nb_selected_team",
    drills: "nb_drills_v2",
    sessions: "nb_sessions_v2",
    weekPlans: "nb_week_plans_v2",
    seasonEvents: "nb_season_events_v2",
};

export default function SettingsScreen() {
    const [teamName, setTeamName] = useState("My Team");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadTeamName();
    }, []);

    const loadTeamName = async () => {
        try {
            const teamData = await AsyncStorage.getItem(LS_KEYS.selectedTeam);
            if (teamData) {
                const team = JSON.parse(teamData);
                setTeamName(team.name);
            } else {
                const name = await AsyncStorage.getItem(LS_KEYS.team);
                if (name) setTeamName(name);
            }
        } catch (error) {
            console.error("Failed to load team name:", error);
        }
    };

    const saveTeamName = async () => {
        try {
            await AsyncStorage.setItem(LS_KEYS.team, teamName);
            setIsEditing(false);
            Alert.alert("Success", "Team name updated!");
        } catch (error) {
            console.error("Failed to save team name:", error);
            Alert.alert("Error", "Failed to save team name");
        }
    };

    const exportData = async () => {
        try {
            const data: any = {};
            for (const [key, value] of Object.entries(LS_KEYS)) {
                const item = await AsyncStorage.getItem(value);
                if (item) {
                    data[key] = JSON.parse(item);
                }
            }

            const jsonString = JSON.stringify(data, null, 2);

            // Copy to clipboard
            await Clipboard.setStringAsync(jsonString);
            Alert.alert("Success", "Data exported to clipboard as JSON!");
        } catch (error) {
            console.error("Failed to export data:", error);
            Alert.alert("Error", "Failed to export data");
        }
    };

    const copySummary = async () => {
        try {
            const drillsData = await AsyncStorage.getItem(LS_KEYS.drills);
            const sessionsData = await AsyncStorage.getItem(LS_KEYS.sessions);
            const weekPlansData = await AsyncStorage.getItem(LS_KEYS.weekPlans);

            const drills = drillsData ? JSON.parse(drillsData) : [];
            const sessions = sessionsData ? JSON.parse(sessionsData) : [];
            const weekPlans = weekPlansData ? JSON.parse(weekPlansData) : [];

            const summary = `
📊 ${teamName} - Training Summary

🏋️ Drills: ${drills.length}
📝 Sessions: ${sessions.length}
📅 Week Plans: ${weekPlans.length}

Plan → Train → Track → Improve
      `.trim();

            await Clipboard.setStringAsync(summary);
            Alert.alert("Success", "Summary copied to clipboard!");
        } catch (error) {
            console.error("Failed to copy summary:", error);
            Alert.alert("Error", "Failed to copy summary");
        }
    };

    const clearAllData = () => {
        Alert.alert(
            "Clear All Data",
            "Are you sure you want to delete all drills, sessions, and plans? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.multiRemove([
                                LS_KEYS.drills,
                                LS_KEYS.sessions,
                                LS_KEYS.weekPlans,
                                LS_KEYS.seasonEvents,
                            ]);
                            Alert.alert("Success", "All data cleared!");
                        } catch (error) {
                            console.error("Failed to clear data:", error);
                            Alert.alert("Error", "Failed to clear data");
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScreenContainer>
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="p-6 gap-5">
                    {/* Header */}
                    <View className="bg-header -mx-6 -mt-6 pt-12 pb-6 px-6 rounded-b-[32px] mb-2">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="w-10 h-10" />
                            <View className="flex-1 items-center">
                                <Text className="text-white/70 text-sm font-medium">My Team</Text>
                                <Text className="text-white text-2xl font-bold tracking-tight">Netball Planner</Text>
                            </View>
                            <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                                <UserIcon size={24} color="#FFFFFF" />
                            </View>
                        </View>
                    </View>

                    {/* Settings Section */}
                    <View className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <Text className="text-foreground font-bold text-xl mb-4">Settings</Text>

                        {/* Team Name */}
                        <View className="mb-4">
                            <Text className="text-foreground font-semibold mb-2">Team name</Text>
                            {isEditing ? (
                                <View className="gap-2">
                                    <TextInput
                                        value={teamName}
                                        onChangeText={setTeamName}
                                        className="bg-background rounded-2xl px-4 py-3 text-foreground border border-border"
                                        placeholder="Enter team name"
                                    />
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity
                                            onPress={saveTeamName}
                                            className="flex-1 bg-primary rounded-xl py-3 active:opacity-70"
                                        >
                                            <Text className="text-white font-bold text-center">Save</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setIsEditing(false);
                                                loadTeamName();
                                            }}
                                            className="flex-1 bg-background rounded-xl py-3 active:opacity-70 border border-border"
                                        >
                                            <Text className="text-foreground font-bold text-center">Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setIsEditing(true)}
                                    className="bg-background rounded-2xl px-4 py-3 border border-border active:opacity-70"
                                >
                                    <Text className="text-foreground">{teamName}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Data Section */}
                    <View className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <Text className="text-foreground font-bold text-xl mb-4">Data</Text>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={exportData}
                                className="flex-1 bg-header rounded-2xl py-4 px-4 active:opacity-70 flex-row items-center justify-center gap-2"
                            >
                                <IconSymbol name="arrow.down.circle" size={20} color="#FFFFFF" />
                                <Text className="text-white font-bold">Export JSON</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={copySummary}
                                className="flex-1 bg-background rounded-2xl py-4 px-4 active:opacity-70 border border-border flex-row items-center justify-center gap-2"
                            >
                                <IconSymbol name="doc.on.doc" size={20} color={themeColors.foreground.light} />
                                <Text className="text-foreground font-bold">Copy summary</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* About Section */}
                    <View className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <Text className="text-foreground font-bold text-xl mb-3">About</Text>

                        <Text className="text-foreground mb-2">
                            <Text className="font-bold">Netball Coach Planner</Text> helps you plan, structure, and analyse training sessions.
                        </Text>

                        <Text className="text-muted text-sm">
                            Plan → Train → Track → Improve
                        </Text>
                    </View>

                    {/* Danger Zone */}
                    <View className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <Text className="text-destructive font-bold text-xl mb-4">Danger Zone</Text>

                        <TouchableOpacity
                            onPress={clearAllData}
                            className="bg-destructive rounded-2xl py-4 px-4 active:opacity-70"
                        >
                            <Text className="text-white font-bold text-center">Clear All Data</Text>
                        </TouchableOpacity>

                        <Text className="text-muted text-xs mt-2 text-center">
                            This will delete all drills, sessions, and plans permanently
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}
