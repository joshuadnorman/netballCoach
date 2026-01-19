import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";

const LS_KEYS = {
  selectedTeam: "nb_selected_team",
};

const TEAMS = [
  { id: "u14a", name: "Under 14 A", color: "#6EC6FF" },
  { id: "u15a", name: "Under 15 A", color: "#8B7CFF" },
  { id: "u16a", name: "Under 16 A", color: "#FF5DA2" },
  { id: "u17a", name: "Under 17 A", color: "#22C55E" },
  { id: "first", name: "First Team", color: "#0A1F44" },
];

export default function TeamSelectScreen() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSelectTeam = (teamId: string) => {
    setSelectedTeam(teamId);
    setError("");
  };

  const handleContinue = async () => {
    if (!selectedTeam) {
      setError("Select a team to continue.");
      return;
    }

    try {
      const team = TEAMS.find((t) => t.id === selectedTeam);
      if (team) {
        await AsyncStorage.setItem(LS_KEYS.selectedTeam, JSON.stringify(team));
        // Also update the team name for backward compatibility
        await AsyncStorage.setItem("nb_team_name_v2", team.name);
      }

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (err) {
      setError("Failed to save team. Please try again.");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F7FAFF]">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-2xl font-bold text-[#0A1F44] mb-2">Select Your Team</Text>
            <Text className="text-[#475569] text-base text-center">
              Choose the team you'll be coaching this season
            </Text>
          </View>

          {/* Team Cards */}
          <View className="gap-3 mb-6">
            {TEAMS.map((team) => (
              <TouchableOpacity
                key={team.id}
                onPress={() => handleSelectTeam(team.id)}
                className={`bg-white rounded-2xl p-5 border-2 ${
                  selectedTeam === team.id
                    ? "border-[#22C55E] bg-[#ECFDF5]"
                    : "border-[#D9E2F1]"
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-4 h-full rounded-full mr-4"
                    style={{ backgroundColor: team.color, width: 4, height: 40 }}
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-[#111827]">{team.name}</Text>
                    <Text className="text-sm text-[#64748B]">MENLO Netball</Text>
                  </View>
                  {selectedTeam === team.id && (
                    <View className="w-6 h-6 rounded-full bg-[#22C55E] items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            className={`rounded-xl py-3 items-center ${
              selectedTeam ? "bg-[#22C55E]" : "bg-[#A7F3D0]"
            }`}
            style={{ height: 48 }}
          >
            <Text className="text-white font-bold text-base">Continue</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View className="items-center mt-8">
            <Text className="text-[#64748B] text-sm italic">"Streef die hoogtes na"</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
