import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { SeasonEvent, EventType } from "@/lib/types";
import { themeColors } from "@/theme.config";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SafeAreaView } from "react-native-safe-area-context";

const LS_KEY = "nb_season_events_v2";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
];

const EVENT_TYPES: { type: EventType; label: string; color: string }[] = [
  { type: "game", label: "Game", color: "#34C759" }, // System Green
  { type: "tournament", label: "Tournament", color: "#FF9500" }, // System Orange
  { type: "birthday", label: "Birthday", color: "#FF2D55" }, // System Pink
  { type: "test", label: "Test Schedule", color: "#007AFF" }, // System Blue
];

const fmtDateISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function SeasonScreen() {
  const [events, setEvents] = useState<SeasonEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SeasonEvent | null>(null);

  // Form state
  const [formType, setFormType] = useState<EventType>("game");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(fmtDateISO(new Date()));
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await AsyncStorage.getItem(LS_KEY);
      if (data) setEvents(JSON.parse(data));
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  const saveEvents = async (newEvents: SeasonEvent[]) => {
    try {
      await AsyncStorage.setItem(LS_KEY, JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error("Failed to save events:", error);
    }
  };

  const currentYear = new Date().getFullYear();

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const map = new Map<number, SeasonEvent[]>();
    MONTHS.forEach((_, i) => map.set(i, []));

    events.forEach((e) => {
      const date = new Date(e.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const list = map.get(month) || [];
        list.push(e);
        map.set(month, list);
      }
    });

    // Sort events by date within each month
    map.forEach((list) => {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return map;
  }, [events, currentYear]);

  const selectedMonthEvents = eventsByMonth.get(selectedMonth) || [];

  const resetForm = () => {
    setFormType("game");
    setFormTitle("");
    setFormDate(fmtDateISO(new Date()));
    setFormNotes("");
  };

  const openAddModal = () => {
    resetForm();
    // Set date to selected month
    const date = new Date(currentYear, selectedMonth, 15);
    setFormDate(fmtDateISO(date));
    setShowAddModal(true);
  };

  const openEditModal = (event: SeasonEvent) => {
    setEditingEvent(event);
    setFormType(event.type);
    setFormTitle(event.title);
    setFormDate(event.date);
    setFormNotes(event.notes || "");
    setShowEditModal(true);
  };

  const addEvent = () => {
    if (!formTitle.trim()) return;

    const newEvent: SeasonEvent = {
      id: uid(),
      type: formType,
      title: formTitle.trim(),
      date: formDate,
      notes: formNotes.trim() || undefined,
    };

    saveEvents([...events, newEvent]);
    setShowAddModal(false);
    resetForm();
  };

  const updateEvent = () => {
    if (!editingEvent || !formTitle.trim()) return;

    const updatedEvents = events.map((e) =>
      e.id === editingEvent.id
        ? {
          ...e,
          type: formType,
          title: formTitle.trim(),
          date: formDate,
          notes: formNotes.trim() || undefined,
        }
        : e
    );

    saveEvents(updatedEvents);
    setShowEditModal(false);
    setEditingEvent(null);
    resetForm();
  };

  const deleteEvent = () => {
    if (!editingEvent) return;

    const updatedEvents = events.filter((e) => e.id !== editingEvent.id);
    saveEvents(updatedEvents);
    setShowEditModal(false);
    setEditingEvent(null);
    resetForm();
  };

  const getEventColor = (type: EventType) => {
    return EVENT_TYPES.find((t) => t.type === type)?.color || "#888";
  };

  const getEventLabel = (type: EventType) => {
    return EVENT_TYPES.find((t) => t.type === type)?.label || type;
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-foreground text-xl font-semibold">Season {currentYear}</Text>
              <Text className="text-muted text-sm">
                Games, tournaments, birthdays & tests
              </Text>
            </View>
            <TouchableOpacity
              onPress={openAddModal}
              className="rounded-xl px-3 py-2 active:opacity-70 bg-primary"
            >
              <Text className="text-white font-medium">+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Month Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MONTHS.map((month, index) => {
              const count = (eventsByMonth.get(index) || []).length;
              const isSelected = selectedMonth === index;
              return (
                <TouchableOpacity
                  key={month}
                  onPress={() => setSelectedMonth(index)}
                  className={`px-4 py-2 rounded-full mr-3 border active:opacity-70 ${isSelected
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                    }`}
                >
                  <Text
                    className={`text-sm font-medium ${isSelected ? "text-white" : "text-foreground"
                      }`}
                  >
                    {month.substring(0, 3)}
                  </Text>
                  {count > 0 && (
                    <View
                      className={`absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center border border-background ${isSelected ? "bg-white" : "bg-primary"
                        }`}
                    >
                      <Text
                        className={`text-xs font-bold ${isSelected ? "text-primary" : "text-white"
                          }`}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Events List */}
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
            <Text className="text-foreground font-semibold mb-3">
              {MONTHS[selectedMonth]} Events
            </Text>

            {selectedMonthEvents.length === 0 ? (
              <View className="py-8">
                <Text className="text-muted text-center">
                  No events scheduled for {MONTHS[selectedMonth]}.
                </Text>
                <TouchableOpacity
                  onPress={openAddModal}
                  className="mt-4 bg-background rounded-xl py-3 active:opacity-70 border border-border"
                >
                  <Text className="text-primary text-center font-medium">
                    + Add Event
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                {selectedMonthEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    onPress={() => openEditModal(event)}
                    className="bg-background rounded-xl p-4 border border-border active:opacity-70"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <View
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getEventColor(event.type) }}
                          />
                          <Text className="text-muted text-xs">
                            {getEventLabel(event.type)}
                          </Text>
                        </View>
                        <Text className="text-foreground font-medium mb-1">{event.title}</Text>
                        <Text className="text-muted text-xs">{event.date}</Text>
                        {event.notes && (
                          <Text className="text-muted text-xs mt-1">{event.notes}</Text>
                        )}
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={themeColors.muted.light} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Legend */}
          <View className="bg-surface rounded-2xl p-4 border border-border mt-4 shadow-sm">
            <Text className="text-foreground font-semibold mb-3">Event Types</Text>
            <View className="flex-row flex-wrap gap-3">
              {EVENT_TYPES.map((et) => (
                <View key={et.type} className="flex-row items-center gap-2">
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: et.color }}
                  />
                  <Text className="text-muted text-sm">{et.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Season Summary */}
          <View className="bg-surface rounded-2xl p-4 border border-border mt-4 shadow-sm">
            <Text className="text-foreground font-semibold mb-3">Season Summary</Text>
            <View className="gap-2">
              {EVENT_TYPES.map((et) => {
                const count = events.filter((e) => e.type === et.type).length;
                return (
                  <View key={et.type} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: et.color }}
                      />
                      <Text className="text-muted text-sm">{et.label}</Text>
                    </View>
                    <Text className="text-foreground font-medium">{count}</Text>
                  </View>
                );
              })}
              <View className="h-px bg-border my-2" />
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Total Events</Text>
                <Text className="text-foreground font-bold">{events.length}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <SafeAreaView edges={[]} className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-foreground text-2xl font-bold">Add Event</Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  className="w-8 h-8 items-center justify-center active:opacity-70"
                >
                  <IconSymbol name="xmark" size={24} color={themeColors.foreground.light} />
                </TouchableOpacity>
              </View>
              <View>


                {/* Event Type */}
                <View className="mb-3">
                  <Text className="text-muted text-xs mb-2">Event Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {EVENT_TYPES.map((et) => (
                      <TouchableOpacity
                        key={et.type}
                        onPress={() => setFormType(et.type)}
                        className={`px-4 py-2 rounded-full border active:opacity-70 ${formType === et.type
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                          }`}
                      >
                        <Text
                          className={formType === et.type ? "text-white" : "text-foreground"}
                        >
                          {et.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Title */}
                <View className="mb-3">
                  <Text className="text-muted text-xs mb-1">Title</Text>
                  <TextInput
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder="Event title..."
                    placeholderTextColor={themeColors.muted.light}
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                  />
                </View>

                {/* Date */}
                <View className="mb-3">
                  <Text className="text-muted text-xs mb-1">Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={themeColors.muted.light}
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                  />
                </View>

                {/* Notes */}
                <View className="mb-4">
                  <Text className="text-muted text-xs mb-1">Notes (optional)</Text>
                  <TextInput
                    value={formNotes}
                    onChangeText={setFormNotes}
                    placeholder="Additional notes..."
                    placeholderTextColor={themeColors.muted.light}
                    multiline
                    numberOfLines={2}
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border min-h-[80px]"
                    textAlignVertical="top"
                  />
                </View>

                {/* Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setShowAddModal(false)}
                    className="flex-1 bg-background rounded-xl py-3 active:opacity-70 border border-border"
                  >
                    <Text className="text-foreground font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={addEvent}
                    disabled={!formTitle.trim()}
                    className={`flex-1 bg-primary rounded-xl py-3 ${!formTitle.trim() ? "opacity-50" : "active:opacity-90"
                      }`}
                  >
                    <Text className="text-white font-semibold text-center">Add Event</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        visible={showEditModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <SafeAreaView edges={[]} className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-foreground text-2xl font-bold">Edit Event</Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  className="w-8 h-8 items-center justify-center active:opacity-70"
                >
                  <IconSymbol name="xmark" size={24} color={themeColors.foreground.light} />
                </TouchableOpacity>
              </View>
              <View>


                {/* Event Type */}
                <View className="mb-3">
                  <Text className="text-muted text-xs mb-2">Event Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {EVENT_TYPES.map((et) => (
                      <TouchableOpacity
                        key={et.type}
                        onPress={() => setFormType(et.type)}
                        className={`px-4 py-2 rounded-full border active:opacity-70 ${formType === et.type
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                          }`}
                      >
                        <Text
                          className={formType === et.type ? "text-white" : "text-foreground"}
                        >
                          {et.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Title */}
                <View className="mb-3">
                  <Text className="text-muted text-xs mb-1">Title</Text>
                  <TextInput
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder="Event title..."
                    placeholderTextColor={themeColors.muted.light}
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                  />
                </View>

                {/* Date */}
                <View className="mb-3">
                  <Text className="text-muted text-xs mb-1">Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={themeColors.muted.light}
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                  />
                </View>

                {/* Notes */}
                <View className="mb-4">
                  <Text className="text-muted text-xs mb-1">Notes (optional)</Text>
                  <TextInput
                    value={formNotes}
                    onChangeText={setFormNotes}
                    placeholder="Additional notes..."
                    placeholderTextColor={themeColors.muted.light}
                    multiline
                    numberOfLines={2}
                    className="bg-background rounded-xl px-4 py-3 text-foreground border border-border min-h-[80px]"
                    textAlignVertical="top"
                  />
                </View>

                {/* Buttons */}
                <View className="gap-3">
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setShowEditModal(false)}
                      className="flex-1 bg-background rounded-xl py-3 active:opacity-70 border border-border"
                    >
                      <Text className="text-foreground font-semibold text-center">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={updateEvent}
                      disabled={!formTitle.trim()}
                      className={`flex-1 bg-primary rounded-xl py-3 ${!formTitle.trim() ? "opacity-50" : "active:opacity-90"
                        }`}
                    >
                      <Text className="text-white font-semibold text-center">Save</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={deleteEvent}
                    className="bg-red-500/10 rounded-xl py-3 active:opacity-70 border border-red-500/20"
                  >
                    <Text className="text-red-500 font-semibold text-center">Delete Event</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
