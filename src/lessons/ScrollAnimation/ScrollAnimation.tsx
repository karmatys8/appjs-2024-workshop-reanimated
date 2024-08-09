import { ContactsListHeader } from "@/components/ContactsListHeader";
import { ContactsListItem } from "@/components/ContactsListItem";
import { Container } from "@/components/Container";
import { alphabet, contacts, ContactSection } from "@/lib/mock";
import { hitSlop } from "@/lib/reanimated";
import { colorShades, layout } from "@/lib/theme";
import { useMemo, useRef } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  Extrapolation,
  interpolate,
  measure,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import sectionListGetItemLayout from "react-native-section-list-get-item-layout";

type AlphabetLetterProps = {
  index: number;
  letter: string;
  scrollableIndex: SharedValue<number>;
};

const AlphabetLetter = ({
  index,
  letter,
  scrollableIndex,
}: AlphabetLetterProps) => {
  const styles = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollableIndex.value,
        [index - 1, index, index + 1],
        [0.5, 1, 0.5],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            scrollableIndex.value,
            [index - 2, index, index + 2],
            [1, 1.5, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        },
        styles,
      ]}
    >
      <Animated.Text
        style={[
          {
            position: "absolute",
            fontFamily: "Menlo",
            left: -20,
            fontWeight: "900",
          },
        ]}
      >
        {letter.toUpperCase()}
      </Animated.Text>
    </Animated.View>
  );
};

export function ScrollAnimationLesson() {
  const y = useSharedValue(0);
  const isInteracting = useSharedValue(false);
  const knobScale = useDerivedValue(() => {
    return withSpring(isInteracting.value ? 1 : 0);
  });

  const alphabetRef = useAnimatedRef<View>();
  const scrollableIndex = useSharedValue(0);
  const activeScrollIndex = useSharedValue(0);

  const scrollViewRef = useRef<SectionList>(null);

  const getItemLayout = useMemo(() => {
    return sectionListGetItemLayout({
      getItemHeight: () => layout.contactListItemHeight,
      getSectionHeaderHeight: () => layout.contactListSectionHeaderHeight,
    });
  }, []);

  const snapIndicatorTo = (index: number) => {
    runOnUI(() => {
      if (scrollableIndex.value === index || isInteracting.value) {
        return;
      }

      const alphabetLayout = measure(alphabetRef);
      if (!alphabetLayout) {
        return;
      }
      const snapBy =
        (alphabetLayout.height - layout.knobSize) / (alphabet.length - 1);
      const snapTo = index * snapBy;
      y.value = withTiming(snapTo);
      scrollableIndex.value = withTiming(index);
    })();
  };

  const scrollToLocation = (index: number) => {
    scrollViewRef.current?.scrollToLocation({
      itemIndex: 0,
      sectionIndex: index,
      animated: false,
    });
  };

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onBegin(() => {
      isInteracting.value = true;
    })
    .onChange((ev) => {
      const alphabetLayout = measure(alphabetRef);
      if (!alphabetLayout) return;

      y.value = clamp(
        (y.value += ev.changeY),
        alphabetLayout.y,
        alphabetLayout.height - layout.knobSize
      );

      const snapBy =
        (alphabetLayout.height - layout.knobSize) / (alphabet.length - 1);

      scrollableIndex.value = y.value / snapBy;
      const snapToIndex = Math.round(scrollableIndex.value);

      runOnJS(scrollToLocation)(snapToIndex);

      if (snapToIndex === activeScrollIndex.value) {
        return;
      }

      activeScrollIndex.value = snapToIndex;
    })
    .onEnd(() => {
      runOnJS(snapIndicatorTo)(activeScrollIndex.value);
    })
    .onFinalize(() => {
      isInteracting.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(
        knobScale.value,
        [0, 1],
        [layout.knobSize / 2, 2],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateY: y.value,
        },
        {
          scale: knobScale.value + 1,
        },
      ],
    };
  });

  return (
    <Container centered={false}>
      <View style={{ flex: 1 }}>
        <SectionList
          ref={scrollViewRef}
          contentContainerStyle={{ paddingHorizontal: layout.spacing * 2 }}
          stickySectionHeadersEnabled={false}
          // @ts-ignore
          getItemLayout={getItemLayout}
          sections={contacts}
          renderSectionHeader={({ section: { title } }) => {
            return <ContactsListHeader title={title} />;
          }}
          renderItem={({ item }) => {
            return <ContactsListItem item={item} />;
          }}
          onViewableItemsChanged={({ viewableItems }) => {
            const half = Math.floor(viewableItems.length / 2)
            const section = viewableItems[half]?.section
            if (!section) {
              return
            }
            const { index } = section as ContactSection
            snapIndicatorTo(index)
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 0,
            top: layout.indicatorSize,
            bottom: layout.indicatorSize,
          }}
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[styles.knob, animatedStyle]}
              hitSlop={hitSlop}
            />
          </GestureDetector>
          <View
            ref={alphabetRef}
            style={{
              transform: [{ translateX: -layout.indicatorSize / 4 }],
              flex: 1,
              width: 20,
              justifyContent: "space-around",
            }}
            pointerEvents="box-none"
          >
            {[...Array(alphabet.length).keys()].map((i) => {
              return (
                <AlphabetLetter
                  key={i}
                  letter={alphabet.charAt(i)}
                  index={i}
                  scrollableIndex={scrollableIndex}
                />
              );
            })}
          </View>
        </View>
      </View>
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
