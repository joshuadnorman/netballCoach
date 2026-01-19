import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { themeColors } from "@/theme.config";

interface Option {
    label: string;
    value: string;
    icon?: string;
}

interface DropdownPickerProps {
    label?: string;
    value: string;
    options: Option[];
    onSelect: (value: string) => void;
    placeholder?: string;
    className?: string;
    modalTitle?: string;
    disabled?: boolean;
}

export function DropdownPicker({
    label,
    value,
    options,
    onSelect,
    placeholder = "Select option",
    className = "",
    modalTitle = "Select Option",
    disabled = false,
}: DropdownPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((o) => o.value === value);

    return (
        <View className={className}>
            {label && <Text className="text-muted text-xs mb-1">{label}</Text>}
            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                disabled={disabled}
                className={`bg-background rounded-xl px-4 py-3 border border-border flex-row justify-between items-center ${disabled ? "opacity-50" : "active:opacity-70"
                    }`}
            >
                <Text className={selectedOption ? "text-foreground" : "text-muted"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <IconSymbol name="chevron.down" size={16} color={themeColors.muted.light} />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <View className="flex-1 justify-end">
                    <Pressable className="flex-1 bg-black/50" onPress={() => setIsOpen(false)} />
                    <View className="bg-card rounded-t-3xl border-t border-border max-h-[70%] overflow-hidden">
                        <View className="items-center pt-3 pb-1">
                            <View className="w-12 h-1.5 bg-muted/20 rounded-full" />
                        </View>
                        <SafeAreaView edges={["bottom"]} className="pb-8 pt-6 w-full">
                            <View style={{ paddingHorizontal: 32 }}>
                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-foreground text-xl font-bold">{modalTitle}</Text>
                                    <TouchableOpacity onPress={() => setIsOpen(false)} className="active:opacity-70">
                                        <IconSymbol name="xmark.circle.fill" size={28} color={themeColors.muted.light} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView>
                                    {options.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => {
                                                onSelect(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`p-4 rounded-xl mb-2 border active:opacity-70 ${value === option.value
                                                ? "bg-primary border-primary"
                                                : "bg-background border-border"
                                                }`}
                                        >
                                            <View className="flex-row items-center gap-3">
                                                {option.icon && <Text className="text-lg">{option.icon}</Text>}
                                                <Text
                                                    className={value === option.value ? "text-white font-medium" : "text-foreground"}
                                                >
                                                    {option.label}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </SafeAreaView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
