import { Container } from "@/components/Container";
import { hitSlop } from "@/lib/reanimated";
import { colorShades, layout } from "@/lib/theme";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function CircleGesturesLesson() {
  const scale = useSharedValue(1);
  const xOffset = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          scale.value = 2;
        })
        .onChange((ev) => {
          xOffset.value += ev.changeX;
        })
        .onEnd(() => {
          xOffset.value = withSpring(0);
        })
        .onFinalize(() => {
          scale.value = withSpring(1);
        }),
    []
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(
        scale.value,
        [1, 2],
        [layout.knobSize / 2, 2],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateX: xOffset.value,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  return (
    <Container>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Animated.View
            style={[styles.knob, animatedStyle]}
            hitSlop={hitSlop}
          />
        </View>
      </GestureDetector>
    </Container>
  );
}

const styles = StyleSheet.create({
  knob: {
    width: layout.knobSize,
    height: layout.knobSize,
    borderRadius: layout.knobSize / 2,
    backgroundColor: "#fff",
    borderWidth: layout.knobSize / 2,
    borderColor: colorShades.purple.base,
    position: "absolute",
    left: -layout.knobSize / 2,
  },
});
