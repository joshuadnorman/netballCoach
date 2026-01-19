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
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { MiniDiagram } from "@/components/drill-canvas";
import { Drill, Session, SessionBlock, CATEGORIES, Category } from "@/lib/types";
import { themeColors } from "@/theme.config";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DropdownPicker } from "@/components/ui/dropdown-picker";

const LS_KEYS = {
  drills: "nb_drills_v2",
  sessions: "nb_sessions_v2",
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const fmtDateISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function TodayScreen() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Session builder state
  const [sessionDate, setSessionDate] = useState(fmtDateISO(new Date()));
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<SessionBlock[]>([]);

  // Add block state
  const [programCategory, setProgramCategory] = useState<Category>(CATEGORIES[0]);
  const [selectedDrillId, setSelectedDrillId] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [blockNotes, setBlockNotes] = useState("");

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [drillsData, sessionsData] = await Promise.all([
        AsyncStorage.getItem(LS_KEYS.drills),
        AsyncStorage.getItem(LS_KEYS.sessions),
      ]);
      if (drillsData) setDrills(JSON.parse(drillsData));
      if (sessionsData) setSessions(JSON.parse(sessionsData));
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const saveSessions = async (newSessions: Session[]) => {
    try {
      await AsyncStorage.setItem(LS_KEYS.sessions, JSON.stringify(newSessions));
      setSessions(newSessions);
    } catch (error) {
      console.error("Failed to save sessions:", error);
    }
  };

  // Group drills by category
  const drillsByCategory = useMemo(() => {
    const map = new Map<string, Drill[]>();
    CATEGORIES.forEach((c) => map.set(c, []));
    drills.forEach((d) => {
      const cat = d.category as string;
      const list = map.get(cat) || [];
      list.push(d);
      map.set(cat, list);
    });
    return map;
  }, [drills]);

  const drillsById = useMemo(() => {
    const map = new Map<string, Drill>();
    drills.forEach((d) => map.set(d.id, d));
    return map;
  }, [drills]);

  const totalMinutes = useMemo(() => blocks.reduce((sum, b) => sum + b.minutes, 0), [blocks]);

  const addBlock = () => {
    if (!selectedDrillId || selectedDrillId === "__none") return;

    const newBlock: SessionBlock = {
      id: uid(),
      category: programCategory,
      drillId: selectedDrillId,
      minutes,
      notes: blockNotes || undefined,
    };

    setBlocks((prev) => [...prev, newBlock]);
    setBlockNotes("");
    setMinutes(10);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const saveSession = async () => {
    if (blocks.length === 0) return;

    const newSession: Session = {
      id: uid(),
      dateISO: sessionDate,
      title: title || "Session",
      blocks,
      totalMinutes,
      createdAt: Date.now(),
    };

    await saveSessions([newSession, ...sessions]);
    setBlocks([]);
    setTitle("");
  };

  const sessionShareText = useMemo(() => {
    const header = `SESSION — ${sessionDate}\n${title || "Session"}\nTotal: ${totalMinutes} min\n\n`;
    const lines = blocks
      .map((b, i) => {
        const drill = drillsById.get(b.drillId);
        return `${i + 1}. ${b.category} — ${drill?.name || "(drill)"} — ${b.minutes} min${b.notes ? `\n   Notes: ${b.notes}` : ""}`;
      })
      .join("\n\n");
    return header + (lines || "(No blocks yet)");
  }, [blocks, drills, sessionDate, title, totalMinutes]);

  const shareSession = async () => {
    if (Platform.OS === "web") {
      setShareModalOpen(true);
    } else {
      try {
        await Share.share({ message: sessionShareText });
      } catch (error) {
        console.error("Failed to share:", error);
      }
    }
  };

  const currentCategoryDrills = drillsByCategory.get(programCategory) || [];

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Sticky Header */}
        <View className="p-6 pb-4 border-b border-border bg-surface/80 backdrop-blur-md">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-foreground text-xl font-semibold">Today — Session Builder</Text>
              <Text className="text-muted text-sm">Add drills + time. Save for stats.</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={shareSession}
                className="bg-background rounded-xl px-3 py-2 active:opacity-70 border border-border"
              >
                <Text className="text-primary font-medium">Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveSession}
                disabled={blocks.length === 0}
                className={`rounded-xl px-3 py-2 bg-primary ${blocks.length === 0 ? "opacity-50" : "active:opacity-70"}`}
              >
                <Text className="text-white font-medium">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="p-6 gap-4">
            {/* Session Info Card */}
            <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <Text className="text-foreground font-semibold mb-3">Build a session</Text>

              {/* Date */}
              <View className="mb-3">
                <Text className="text-muted text-xs mb-1">Date</Text>
                <TextInput
                  value={sessionDate}
                  onChangeText={setSessionDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={themeColors.muted.light}
                  className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                />
              </View>

              {/* Title */}
              <View className="mb-3">
                <Text className="text-muted text-xs mb-1">Session title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Centre pass + D 1/3 defence"
                  placeholderTextColor={themeColors.muted.light}
                  className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                />
              </View>

              {/* Divider */}
              <View className="h-px bg-border my-3" />

              {/* Category Selector */}
              <DropdownPicker
                label="Category"
                value={programCategory}
                options={CATEGORIES.map((cat) => ({ label: cat, value: cat }))}
                onSelect={(val) => {
                  setProgramCategory(val as Category);
                  setSelectedDrillId("");
                }}
                modalTitle="Select Category"
                className="mb-3"
              />

              {/* Drill Selector */}
              <DropdownPicker
                label="Drill"
                value={selectedDrillId}
                options={[
                  ...currentCategoryDrills.map((d) => ({ label: d.name, value: d.id })),
                ]}
                onSelect={(val) => setSelectedDrillId(val)}
                placeholder={currentCategoryDrills.length === 0 ? "No drills in category" : "Select drill"}
                disabled={currentCategoryDrills.length === 0}
                modalTitle={`Select Drill (${programCategory})`}
                className="mb-3"
              />

              {/* Time */}
              <View className="mb-3">
                <Text className="text-muted text-xs mb-1">Time (min)</Text>
                <TextInput
                  value={String(minutes)}
                  onChangeText={(t) => setMinutes(Math.max(0, parseInt(t) || 0))}
                  keyboardType="numeric"
                  className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                />
              </View>

              {/* Block Notes */}
              <View className="mb-3">
                <Text className="text-muted text-xs mb-1">Block notes (optional)</Text>
                <TextInput
                  value={blockNotes}
                  onChangeText={setBlockNotes}
                  placeholder="Coaching cues..."
                  placeholderTextColor={themeColors.muted.light}
                  className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                />
              </View>

              {/* Add Button */}
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={addBlock}
                  disabled={!selectedDrillId || selectedDrillId === "__none"}
                  className={`rounded-xl px-4 py-3 bg-primary ${!selectedDrillId ? "opacity-50" : "active:opacity-70"}`}
                >
                  <Text className="text-white font-semibold">+ Add to session</Text>
                </TouchableOpacity>
                <View className="flex-row items-center gap-2">
                  <Text className="text-muted text-sm">Total:</Text>
                  <Text className="text-foreground font-bold">{totalMinutes} min</Text>
                </View>
              </View>
            </View>

            {/* Session Blocks */}
            <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <Text className="text-foreground font-semibold mb-3">Session blocks</Text>

              {blocks.length === 0 ? (
                <Text className="text-muted text-sm">Add blocks to build your session.</Text>
              ) : (
                <View className="gap-3">
                  {blocks.map((b, idx) => {
                    const drill = drillsById.get(b.drillId);
                    return (
                      <View
                        key={b.id}
                        className="bg-background rounded-xl p-4 border border-border"
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                              <View className="bg-surface px-2 py-0.5 rounded-full border border-border">
                                <Text className="text-muted text-xs">{b.category}</Text>
                              </View>
                              <Text className="text-muted text-xs">{b.minutes} min</Text>
                            </View>
                            <Text className="text-foreground font-medium">{drill?.name || "(drill)"}</Text>
                            {b.notes ? (
                              <Text className="text-muted text-xs mt-1">{b.notes}</Text>
                            ) : null}
                          </View>
                          <View className="flex-row gap-1">
                            <TouchableOpacity
                              onPress={() => moveBlock(idx, -1)}
                              className="bg-surface w-8 h-8 rounded-lg items-center justify-center active:opacity-70 border border-border"
                            >
                              <IconSymbol name="arrow.up" size={14} color={themeColors.foreground.light} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => moveBlock(idx, 1)}
                              className="bg-surface w-8 h-8 rounded-lg items-center justify-center active:opacity-70 border border-border"
                            >
                              <IconSymbol name="arrow.down" size={14} color={themeColors.foreground.light} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => removeBlock(b.id)}
                              className="bg-red-500/10 w-8 h-8 rounded-lg items-center justify-center active:opacity-70 border border-red-500/20"
                            >
                              <IconSymbol name="xmark" size={14} color={themeColors.error.light} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Secondary Save Button */}
                  <TouchableOpacity
                    onPress={saveSession}
                    className="bg-primary rounded-xl py-4 mt-2 active:opacity-90 shadow-sm"
                  >
                    <Text className="text-white text-center font-bold text-lg">Save Session</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Recent Sessions */}
            <View className="bg-surface rounded-2xl p-4 border border-border mt-2 shadow-sm">
              <Text className="text-foreground font-semibold mb-3">Recent Sessions</Text>

              {sessions.length === 0 ? (
                <Text className="text-muted text-sm">No saved sessions yet.</Text>
              ) : (
                <View className="gap-2">
                  {sessions.slice(0, 5).map((s) => (
                    <View
                      key={s.id}
                      className="bg-background rounded-xl p-3 border border-border"
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-foreground font-medium">{s.title}</Text>
                          <Text className="text-muted text-xs">{s.dateISO}</Text>
                        </View>
                        <View className="bg-surface px-2 py-1 rounded-full border border-border">
                          <Text className="text-muted text-xs">{s.totalMinutes} min</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Share Modal (Web) */}
        <Modal
          visible={shareModalOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShareModalOpen(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-6">
            <View className="bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <SafeAreaView edges={[]} className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-foreground text-2xl font-bold">Share Session</Text>
                  <TouchableOpacity
                    onPress={() => setShareModalOpen(false)}
                    className="w-8 h-8 items-center justify-center active:opacity-70"
                  >
                    <IconSymbol name="xmark" size={24} color={themeColors.foreground.light} />
                  </TouchableOpacity>
                </View>

                <View className="bg-background rounded-2xl p-5 border border-border mb-6 shadow-sm">
                  <Text className="text-foreground text-sm font-mono leading-relaxed">{sessionShareText}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShareModalOpen(false)}
                  className="bg-primary rounded-2xl py-4 active:opacity-90"
                >
                  <Text className="text-white font-semibold text-center">Close</Text>
                </TouchableOpacity>
              </SafeAreaView>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}
