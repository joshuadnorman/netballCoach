import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { ScreenContainer } from "@/components/screen-container";
import { NetballCourtBackground } from "@/components/netball-court-background";
import { DrillCanvas, MiniDiagram } from "@/components/drill-canvas";
import { Drill, DrillDiagram, CATEGORIES, Category } from "@/lib/types";
import { themeColors } from "@/theme.config";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DropdownPicker } from "@/components/ui/dropdown-picker";

const LS_KEYS = {
  drills: "nb_drills_v2",
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

type CreateStep = "draw" | "details";
type DrawMode = "draw" | "cone";
type ConeColor = "red" | "blue" | "yellow";

import { useLocalSearchParams } from "expo-router";

export default function ExercisesScreen() {
  const params = useLocalSearchParams();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "ALL">("ALL");

  // Create drill state
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("draw");
  const [draft, setDraft] = useState({
    name: "",
    category: CATEGORIES[0] as Category,
    description: "",
    diagram: { strokes: [], cones: [] } as DrillDiagram,
    mediaUrl: undefined as string | undefined,
    mediaType: undefined as "image" | "video" | undefined,
  });

  // Drawing state
  const [drawMode, setDrawMode] = useState<DrawMode>("draw");
  const [coneColor, setConeColor] = useState<ConeColor>("red");
  const [penSize, setPenSize] = useState(3);

  // View drill state
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const draftPlayer = useVideoPlayer(draft.mediaUrl || "", (player) => {
    player.loop = true;
    player.play();
  });

  const viewPlayer = useVideoPlayer(selectedDrill?.mediaUrl || "", (player) => {
    player.loop = true;
    player.play();
  });

  useEffect(() => {
    loadDrills();
  }, []);

  useEffect(() => {
    if (params.autoCreate === "true") {
      openCreate();
    }
  }, [params.autoCreate]);

  const loadDrills = async () => {
    try {
      const saved = await AsyncStorage.getItem(LS_KEYS.drills);
      if (saved) {
        setDrills(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load drills:", error);
    }
  };

  const saveDrills = async (newDrills: Drill[]) => {
    try {
      await AsyncStorage.setItem(LS_KEYS.drills, JSON.stringify(newDrills));
      setDrills(newDrills);
    } catch (error) {
      console.error("Failed to save drills:", error);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drills
      .filter((d) => (categoryFilter === "ALL" ? true : d.category === categoryFilter))
      .filter((d) => (q ? `${d.name} ${d.description || ""}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [categoryFilter, drills, search]);

  const resetDraft = () => {
    setDraft({
      name: "",
      category: CATEGORIES[0] as Category,
      description: "",
      diagram: { strokes: [], cones: [] },
      mediaUrl: undefined,
      mediaType: undefined,
    });
    setCreateStep("draw");
  };

  const openCreate = () => {
    resetDraft();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateStep("draw");
  };

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setDraft((prev) => ({
          ...prev,
          mediaUrl: result.assets[0].uri,
          mediaType: result.assets[0].type === "video" ? "video" : "image",
        }));
      }
    } catch (error) {
      console.error("Error picking media:", error);
      alert("Failed to pick media");
    }
  };

  const saveDrill = async () => {
    const hasContent =
      draft.diagram.strokes.some((s) => s.points.length > 0) || draft.diagram.cones.length > 0;

    if (!draft.name.trim()) {
      alert("Please enter a drill name");
      return;
    }

    const newDrill: Drill = {
      id: uid(),
      name: draft.name.trim() || "Untitled drill",
      category: draft.category,
      description: draft.description || "",
      diagram: draft.diagram,
      mediaUrl: draft.mediaUrl,
      mediaType: draft.mediaType,
      createdAt: Date.now(),
    };

    await saveDrills([newDrill, ...drills]);
    closeCreate();
    resetDraft();
  };

  const deleteDrill = (id: string) => {
    saveDrills(drills.filter((d) => d.id !== id));
    setViewOpen(false);
  };

  const clearCanvas = () => {
    setDraft((prev) => ({ ...prev, diagram: { strokes: [], cones: [] } }));
  };

  const undo = () => {
    setDraft((prev) => {
      const { strokes, cones } = prev.diagram;
      if (strokes.length > 0) {
        return {
          ...prev,
          diagram: { ...prev.diagram, strokes: strokes.slice(0, -1) },
        };
      } else if (cones.length > 0) {
        return {
          ...prev,
          diagram: { ...prev.diagram, cones: cones.slice(0, -1) },
        };
      }
      return prev;
    });
  };

  const canSave = useMemo(() => {
    const hasAnyStroke = draft.diagram.strokes.some((s) => s.points.length > 0);
    const hasAnyCone = draft.diagram.cones.length > 0;
    const hasMedia = !!draft.mediaUrl;
    return draft.name.trim().length > 0 && (hasAnyStroke || hasAnyCone || hasMedia);
  }, [draft]);

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-foreground text-xl font-semibold">My Exercises</Text>
              <Text className="text-muted text-sm">Create drills: Draw → Details → Save</Text>
            </View>
            <TouchableOpacity
              onPress={openCreate}
              className="bg-primary rounded-xl px-4 py-2 active:opacity-90"
            >
              <Text className="text-white font-semibold">+ Create</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search drills..."
            placeholderTextColor={themeColors.muted.light}
            className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border mb-3 shadow-sm"
          />

          {/* Category Filter */}
          <DropdownPicker
            label="Category Filter"
            value={categoryFilter}
            options={[
              { label: "All Categories", value: "ALL" },
              ...CATEGORIES.map((cat) => ({ label: cat, value: cat })),
            ]}
            onSelect={(val) => setCategoryFilter(val as Category | "ALL")}
            modalTitle="Filter by Category"
          />
        </View>

        {/* Drills List */}
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
          {filtered.length === 0 ? (
            <View className="bg-surface rounded-2xl p-8 border border-border shadow-sm">
              <Text className="text-muted text-center">
                {drills.length === 0
                  ? "No drills yet. Tap '+ Create' to make your first drill!"
                  : "No drills match your search."}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filtered.map((drill) => (
                <TouchableOpacity
                  key={drill.id}
                  onPress={() => {
                    setSelectedDrill(drill);
                    setViewOpen(true);
                  }}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70 shadow-sm"
                >
                  <View className="flex-row gap-3">
                    <View className="bg-background rounded-xl overflow-hidden border border-border items-center justify-center w-[100px] h-[70px]">
                      {drill.mediaUrl ? (
                        drill.mediaType === "video" ? (
                          <View className="w-full h-full bg-black/10 items-center justify-center">
                            <IconSymbol name="play.fill" size={24} color={themeColors.primary.light} />
                          </View>
                        ) : (
                          <Image
                            source={{ uri: drill.mediaUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        )
                      ) : (
                        <MiniDiagram diagram={drill.diagram} width={100} height={70} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold mb-1">{drill.name}</Text>
                      <View className="bg-background px-2 py-1 rounded-full self-start mb-2 border border-border">
                        <Text className="text-muted text-xs">{drill.category}</Text>
                      </View>
                      {drill.description ? (
                        <Text className="text-muted text-xs" numberOfLines={2}>
                          {drill.description}
                        </Text>
                      ) : null}
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={themeColors.muted.light} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Create Drill Modal */}
      <Modal
        visible={createOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCreate}
      >
        <View className="flex-1 bg-background overflow-hidden">
          {/* Navy Header */}
          <View className="bg-header pt-12 pb-4 px-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-bold text-2xl">Drill Creator</Text>
              <View className="flex-row gap-3">
                {createStep === "draw" ? (
                  <TouchableOpacity
                    onPress={() => setCreateStep("details")}
                    className="bg-white/20 px-5 py-2 rounded-xl active:opacity-70 flex-row items-center gap-2"
                  >
                    <IconSymbol name="checkmark.circle" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold">Done</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={saveDrill}
                    disabled={!canSave}
                    className={`bg-white/20 px-5 py-2 rounded-xl flex-row items-center gap-2 ${canSave ? "active:opacity-70" : "opacity-50"}`}
                  >
                    <IconSymbol name="checkmark.circle" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold">Done</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={closeCreate}
                  className="bg-secondary px-5 py-2 rounded-xl active:opacity-70"
                >
                  <Text className="text-white font-bold">Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView className="flex-1">
            <View className="p-6">
              {createStep === "draw" ? (
                <View className="gap-6">
                  {/* Section Title */}
                  <Text className="text-foreground font-bold text-lg">Draw your drill (movement + cones)</Text>

                  {/* Drawing Tools */}
                  <View className="flex-row flex-wrap gap-3">
                    <TouchableOpacity
                      onPress={() => setDrawMode("draw")}
                      className={`px-5 py-3 rounded-2xl ${drawMode === "draw" ? "bg-primary" : "bg-secondary"} active:opacity-70`}
                    >
                      <Text className="text-white font-semibold">— Solid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDrawMode("draw")}
                      className="px-5 py-3 rounded-2xl bg-secondary active:opacity-70"
                    >
                      <Text className="text-white font-semibold">··· Dotted</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDrawMode("draw")}
                      className="px-5 py-3 rounded-2xl bg-secondary active:opacity-70"
                    >
                      <Text className="text-white font-semibold">⌢ Curved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDrawMode("cone")}
                      className={`px-5 py-3 rounded-2xl ${drawMode === "cone" ? "bg-primary" : "bg-secondary"} active:opacity-70`}
                    >
                      <Text className="text-white font-semibold">+ Cone</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Color and Size Selectors */}
                  <View className="flex-row items-center gap-4">
                    {/* Color Selector */}
                    <View className="flex-row items-center gap-2 bg-background rounded-2xl px-4 py-2 border border-border">
                      <Text className="text-foreground font-medium">Blue</Text>
                      <IconSymbol name="chevron.down" size={16} color={themeColors.foreground.light} />
                    </View>

                    {/* Size Selector */}
                    <View className="flex-row items-center gap-2 bg-background rounded-2xl px-4 py-2 border border-border">
                      <Text className="text-foreground font-medium">Medium</Text>
                      <IconSymbol name="chevron.down" size={16} color={themeColors.foreground.light} />
                    </View>

                    {/* Undo Button */}
                    <TouchableOpacity
                      onPress={undo}
                      className="w-10 h-10 rounded-full bg-secondary items-center justify-center active:opacity-70"
                    >
                      <IconSymbol name="arrow.uturn.backward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Clear Button */}
                    <TouchableOpacity
                      onPress={clearCanvas}
                      className="w-10 h-10 rounded-full bg-secondary items-center justify-center active:opacity-70"
                    >
                      <IconSymbol name="trash" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Drawing Canvas */}
                  <View className="bg-white rounded-3xl p-6 shadow-lg">
                    <DrillCanvas
                      diagram={draft.diagram}
                      onDiagramChange={(d) => setDraft((prev) => ({ ...prev, diagram: d }))}
                      mode={drawMode}
                      coneColor={coneColor}
                      penSize={penSize}
                      width={350}
                      height={220}
                    />
                  </View>

                  <Text className="text-muted text-sm">Click to set the start point.</Text>

                  <Text className="text-muted text-xs">
                    Tip: Draw lines for movement and passing. Switch to Cone to place markers.
                  </Text>
                </View>
              ) : (
                <View className="gap-4">
                  {/* Media Upload */}
                  <View>
                    <Text className="text-muted text-sm mb-2">Drill Media (Optional)</Text>
                    <TouchableOpacity
                      onPress={pickMedia}
                      className="bg-background border border-border border-dashed rounded-xl p-4 items-center justify-center active:opacity-70 min-h-[120px]"
                    >
                      {draft.mediaUrl ? (
                        <View className="w-full h-48 rounded-lg overflow-hidden relative">
                          {draft.mediaType === "video" ? (
                            <VideoView
                              player={draftPlayer}
                              style={{ width: "100%", height: "100%" }}
                              allowsFullscreen
                              allowsPictureInPicture
                            />
                          ) : (
                            <Image
                              source={{ uri: draft.mediaUrl }}
                              className="w-full h-full"
                              resizeMode="contain"
                            />
                          )}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setDraft((prev) => ({ ...prev, mediaUrl: undefined, mediaType: undefined }));
                            }}
                            className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"
                          >
                            <IconSymbol name="xmark" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="items-center gap-2">
                          <IconSymbol name="photo" size={24} color={themeColors.muted.light} />
                          <Text className="text-muted text-sm">Tap to upload image or video</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Preview */}
                  <View>
                    <Text className="text-muted text-sm mb-2">Preview</Text>
                    <View className="border border-border rounded-xl overflow-hidden bg-background">
                      <MiniDiagram diagram={draft.diagram} width={340} height={160} />
                    </View>
                  </View>

                  {/* Name */}
                  <View>
                    <Text className="text-muted text-sm mb-2">Drill name *</Text>
                    <TextInput
                      value={draft.name}
                      onChangeText={(text) => setDraft((prev) => ({ ...prev, name: text }))}
                      placeholder="e.g., 3-cone centre pass"
                      placeholderTextColor={themeColors.muted.light}
                      className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                    />
                  </View>

                  {/* Category */}
                  <DropdownPicker
                    label="Category"
                    value={draft.category}
                    options={CATEGORIES.map((cat) => ({ label: cat, value: cat }))}
                    onSelect={(val) => setDraft((prev) => ({ ...prev, category: val as Category }))}
                    modalTitle="Select Category"
                  />

                  {/* Description */}
                  <View>
                    <Text className="text-muted text-sm mb-2">Description (optional)</Text>
                    <TextInput
                      value={draft.description}
                      onChangeText={(text) => setDraft((prev) => ({ ...prev, description: text }))}
                      placeholder="Coaching notes, setup instructions..."
                      placeholderTextColor={themeColors.muted.light}
                      multiline
                      numberOfLines={4}
                      className="bg-background rounded-xl px-4 py-3 text-foreground border border-border min-h-[100px]"
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Edit Drawing Button */}
                  <TouchableOpacity
                    onPress={() => setCreateStep("draw")}
                    className="bg-background rounded-xl py-3 active:opacity-70 border border-border"
                  >
                    <Text className="text-primary font-medium text-center">← Edit Drawing</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer with Progress */}
          <View className="bg-background border-t border-border p-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-sm">
                Draw → Done → Details → Save.
              </Text>
              <TouchableOpacity
                onPress={closeCreate}
                className="bg-secondary px-5 py-2 rounded-xl active:opacity-70"
              >
                <Text className="text-white font-bold">Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Drill Modal */}
      < Modal
        visible={viewOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewOpen(false)
        }
      >
        <View className="flex-1 justify-end">
          <Pressable className="flex-1 bg-black/50" onPress={() => setViewOpen(false)} />
          <View className="bg-surface rounded-t-3xl border-t border-border max-h-[85%] overflow-hidden">
            <View className="items-center pt-3 pb-1">
              <View className="w-12 h-1.5 bg-muted/20 rounded-full" />
            </View>
            <SafeAreaView edges={["bottom"]} className="pb-8 pt-6 w-full">
              <View style={{ paddingHorizontal: 32 }}>
                {selectedDrill && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="flex-row justify-between items-center mb-6">
                      <Text className="text-foreground text-2xl font-bold flex-1 mr-2">{selectedDrill.name}</Text>
                      <TouchableOpacity onPress={() => setViewOpen(false)} className="active:opacity-70">
                        <IconSymbol name="xmark.circle.fill" size={32} color={themeColors.muted.light} />
                      </TouchableOpacity>
                    </View>

                    {/* Media View */}
                    {selectedDrill.mediaUrl && (
                      <View className="border border-border rounded-xl overflow-hidden bg-background mb-4 h-56">
                        {selectedDrill.mediaType === "video" ? (
                          <VideoView
                            player={viewPlayer}
                            style={{ width: "100%", height: "100%" }}
                            allowsFullscreen
                            allowsPictureInPicture
                          />
                        ) : (
                          <Image
                            source={{ uri: selectedDrill.mediaUrl }}
                            className="w-full h-full"
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    )}

                    {/* Diagram View */}
                    <View className="border border-border rounded-xl overflow-hidden bg-background mb-4">
                      <MiniDiagram diagram={selectedDrill.diagram} width={340} height={180} />
                    </View>

                    <View className="gap-3">
                      <View className="bg-background px-3 py-1.5 rounded-full self-start border border-border">
                        <Text className="text-muted text-sm">{selectedDrill.category}</Text>
                      </View>

                      {selectedDrill.description ? (
                        <View>
                          <Text className="text-muted text-sm mb-1">Description</Text>
                          <Text className="text-foreground">{selectedDrill.description}</Text>
                        </View>
                      ) : null}

                      <Text className="text-muted text-xs mt-2">
                        Created: {new Date(selectedDrill.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View className="flex-row gap-3 mt-6">
                      <TouchableOpacity
                        onPress={() => setViewOpen(false)}
                        className="flex-1 bg-background rounded-xl py-3 active:opacity-70 border border-border"
                      >
                        <Text className="text-foreground font-semibold text-center">Close</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteDrill(selectedDrill.id)}
                        className="flex-1 rounded-xl py-3 active:opacity-70 bg-red-500"
                      >
                        <Text className="text-white font-semibold text-center">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                )}
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal >
    </ScreenContainer >
  );
}
