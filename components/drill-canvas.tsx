import { View, Text } from "react-native";
import { useState, useRef, useEffect } from "react";
import Svg, { Path, Circle, Rect, Line, G, Polygon, Text as SvgText } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { DrillDiagram, Point, Stroke, Cone } from "@/lib/types";

interface DrillCanvasProps {
  diagram: DrillDiagram;
  onDiagramChange: (diagram: DrillDiagram) => void;
  mode: "draw" | "cone";
  coneColor: "red" | "blue" | "yellow";
  penSize?: number;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 340;
const DEFAULT_HEIGHT = 200;

export function DrillCanvas({
  diagram,
  onDiagramChange,
  mode,
  coneColor,
  penSize = 3,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: DrillCanvasProps) {
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const diagramRef = useRef(diagram);

  useEffect(() => {
    diagramRef.current = diagram;
  }, [diagram]);

  const commit = (newDiagram: DrillDiagram) => {
    diagramRef.current = newDiagram;
    onDiagramChange(newDiagram);
  };

  const drawGesture = Gesture.Pan()
    .onStart((event) => {
      if (mode === "draw") {
        const pos = { x: event.x / width, y: event.y / height };
        const newStroke: Stroke = {
          id: Date.now().toString(),
          points: [pos],
          size: penSize,
        };
        const cur = diagramRef.current;
        commit({ ...cur, strokes: [...cur.strokes, newStroke] });
      }
    })
    .onUpdate((event) => {
      if (mode === "draw") {
        const pos = { x: event.x / width, y: event.y / height };
        const cur = diagramRef.current;
        const strokes = [...cur.strokes];
        const lastStroke = strokes[strokes.length - 1];
        if (!lastStroke) return;

        const pts = lastStroke.points || [];
        const prev = pts[pts.length - 1];
        if (prev && Math.hypot(pos.x - prev.x, pos.y - prev.y) < 0.002) return;

        lastStroke.points = [...pts, pos];
        commit({ ...cur, strokes });
      }
    })
    .onEnd(() => {
      setCurrentStroke([]);
    });

  const tapGesture = Gesture.Tap().onEnd((event) => {
    if (mode === "cone") {
      const pos = { x: event.x / width, y: event.y / height };
      const newCone: Cone = {
        x: pos.x,
        y: pos.y,
        color: coneColor,
      };
      const cur = diagramRef.current;
      commit({ ...cur, cones: [...cur.cones, newCone] });
    }
  });

  const combinedGesture = Gesture.Exclusive(drawGesture, tapGesture);

  const pathData = (points: Point[]) => {
    if (points.length === 0) return "";
    return points.reduce((acc, point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      if (index === 0) return `M ${x} ${y}`;
      return `${acc} L ${x} ${y}`;
    }, "");
  };

  const getConeColor = (color: string) => {
    switch (color) {
      case "red":
        return "#EF4444";
      case "blue":
        return "#3B82F6";
      case "yellow":
        return "#F59E0B";
      default:
        return "#EF4444";
    }
  };

  return (
    <View className="rounded-3xl border-4 overflow-hidden" style={{ borderColor: "#1B4332" }}>
      <GestureDetector gesture={combinedGesture}>
        <View style={{ width, height, backgroundColor: "#2D6A4F" }} className="overflow-hidden">
          <Svg width={width} height={height}>
            {/* Court background - solid green, no overlay */}

            {/* Court outline */}
            <Rect
              x="10"
              y="10"
              width={width - 20}
              height={height - 20}
              stroke="#FFFFFF"
              strokeWidth="2"
              fill="none"
              rx="14"
            />

            {/* Thirds lines */}
            <Line
              x1={width / 3}
              y1="10"
              x2={width / 3}
              y2={height - 10}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            <Line
              x1={(width * 2) / 3}
              y1="10"
              x2={(width * 2) / 3}
              y2={height - 10}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />

            {/* Center circle */}
            <Circle
              cx={width / 2}
              cy={height / 2}
              r="30"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Goal circles */}
            <Path
              d={`M ${width / 6} ${height - 10} A ${width / 6} ${height / 3} 0 0 1 ${width / 6} 10`}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              fill="none"
            />
            <Path
              d={`M ${(width * 5) / 6} 10 A ${width / 6} ${height / 3} 0 0 1 ${(width * 5) / 6} ${height - 10}`}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              fill="none"
            />
            <Path
              d={`M ${width - 10} ${height / 2} A ${height * 0.4} ${height * 0.4} 0 0 0 ${width - 10 - height * 0.35} ${height * 0.15}`}
              stroke="#1B263B"
              strokeWidth="1"
              strokeOpacity="0.5"
              fill="none"
            />
            <Path
              d={`M ${width - 10} ${height / 2} A ${height * 0.4} ${height * 0.4} 0 0 1 ${width - 10 - height * 0.35} ${height * 0.85}`}
              stroke="#1B263B"
              strokeWidth="1"
              strokeOpacity="0.5"
              fill="none"
            />

            {/* Existing strokes */}
            {diagram.strokes.map((stroke) => (
              <Path
                key={stroke.id}
                d={pathData(stroke.points)}
                stroke="#1B263B"
                strokeWidth={stroke.size}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}

            {/* Cones */}
            {diagram.cones.map((cone, index) => {
              const cx = cone.x * width;
              const cy = cone.y * height;
              const size = 8;
              return (
                <G key={index}>
                  <Polygon
                    points={`${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`}
                    fill={getConeColor(cone.color)}
                    stroke="#1B263B"
                    strokeWidth="1.5"
                  />
                </G>
              );
            })}
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
}

// Mini diagram for displaying drill thumbnails
export function MiniDiagram({ diagram, width = 120, height = 80 }: { diagram: DrillDiagram; width?: number; height?: number }) {
  const pathData = (points: Point[]) => {
    if (!points || points.length === 0) return "";
    return points.reduce((acc, point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      if (index === 0) return `M ${x} ${y}`;
      return `${acc} L ${x} ${y}`;
    }, "");
  };

  const getConeColor = (color: string) => {
    switch (color) {
      case "red":
        return "#EF4444";
      case "blue":
        return "#3B82F6";
      case "yellow":
        return "#F59E0B";
      default:
        return "#EF4444";
    }
  };

  return (
    <View className="rounded-2xl border border-border bg-surface p-1 overflow-hidden">
      <Svg width={width} height={height}>
        {/* Court background */}
        <Rect x="0" y="0" width={width} height={height} fill="rgba(52, 211, 153, 0.1)" rx="8" />

        {/* Court outline */}
        <Rect
          x="4"
          y="4"
          width={width - 8}
          height={height - 8}
          stroke="#1B263B"
          strokeWidth="1"
          fill="none"
          rx="6"
        />

        {/* Strokes */}
        {(diagram?.strokes || []).map((stroke) => (
          <Path
            key={stroke.id}
            d={pathData(stroke.points)}
            stroke="#1B263B"
            strokeWidth={Math.max(1, stroke.size * 0.5)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}

        {/* Cones */}
        {(diagram?.cones || []).map((cone, index) => {
          const cx = cone.x * width;
          const cy = cone.y * height;
          const size = 4;
          return (
            <Polygon
              key={index}
              points={`${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`}
              fill={getConeColor(cone.color)}
              stroke="#1B263B"
              strokeWidth="0.5"
            />
          );
        })}
      </Svg>
    </View>
  );
}
