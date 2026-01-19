import { View } from "react-native";
import Svg, { Rect, Line, Circle, Path } from "react-native-svg";
import { useColorScheme } from "nativewind";
import { themeColors } from "@/theme.config";

/**
 * NetballCourtBackground component
 * 
 * Renders a subtle netball court illustration.
 * Adapts to light/dark mode using theme colors.
 */
export function NetballCourtBackground() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Use muted color for lines, very subtle opacity
  const strokeColor = isDark ? themeColors.muted.dark : themeColors.muted.light;

  return (
    <View className="absolute inset-0 pointer-events-none overflow-hidden bg-background">
      {/* Court SVG */}
      <View className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.1]">
        <Svg width={360} height={240} viewBox="0 0 900 520">
          {/* Outer court rectangle */}
          <Rect
            x="40"
            y="40"
            width="820"
            height="440"
            rx="18"
            stroke={strokeColor}
            strokeWidth="6"
            fill="none"
          />

          {/* Thirds lines */}
          <Line x1="313" y1="40" x2="313" y2="480" stroke={strokeColor} strokeWidth="5" />
          <Line x1="586" y1="40" x2="586" y2="480" stroke={strokeColor} strokeWidth="5" />

          {/* Center circle */}
          <Circle cx="450" cy="260" r="62" stroke={strokeColor} strokeWidth="5" fill="none" />

          {/* Left goal circle (larger) */}
          <Path
            d="M40 260 A220 220 0 0 1 260 40"
            stroke={strokeColor}
            strokeWidth="5"
            fill="none"
          />
          <Path
            d="M40 260 A220 220 0 0 0 260 480"
            stroke={strokeColor}
            strokeWidth="5"
            fill="none"
          />

          {/* Right goal circle (larger) */}
          <Path
            d="M860 260 A220 220 0 0 0 640 40"
            stroke={strokeColor}
            strokeWidth="5"
            fill="none"
          />
          <Path
            d="M860 260 A220 220 0 0 1 640 480"
            stroke={strokeColor}
            strokeWidth="5"
            fill="none"
          />
        </Svg>
      </View>
    </View>
  );
}
