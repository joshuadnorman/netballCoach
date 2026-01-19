import Svg, { Path, Circle } from "react-native-svg";
import { View } from "react-native";

interface IconProps {
    size?: number;
    color?: string;
}

export function MenuIcon({ size = 24, color = "#FFFFFF" }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M3 12H21M3 6H21M3 18H21"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export function UserIcon({ size = 24, color = "#FFFFFF" }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
            <Path
                d="M6 21C6 17.134 8.686 14 12 14C15.314 14 18 17.134 18 21"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </Svg>
    );
}

export function NetballIcon({ size = 24, color = "#FFFFFF" }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
            <Path
                d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22"
                stroke={color}
                strokeWidth="2"
            />
            <Path
                d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22"
                stroke={color}
                strokeWidth="2"
            />
            <Path d="M2 12H22" stroke={color} strokeWidth="2" />
        </Svg>
    );
}
