import { Container } from "@/components/Container";
import { tabsList } from "@/lib/mock";
import { hitSlop } from "@/lib/reanimated";
import { colorShades, layout } from "@/lib/theme";
import { memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  measure,
  runOnJS,
  runOnUI,
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { MeasuredDimensions } from "react-native-reanimated/src/reanimated2/commonTypes";

type TabsProps = {
  name: string;
  onActive: (measurements: MeasuredDimensions) => void;
  isActiveTabIndex: boolean;
};

const Tab = memo(({ onActive, name, isActiveTabIndex }: TabsProps) => {
  const tabRef = useAnimatedRef<View>();

  const sendMeasurements = () => {
    runOnUI(() => {
      const measurements = measure(tabRef);
      runOnJS(onActive)(measurements);
    })();
  };

  useEffect(() => {
    if (isActiveTabIndex) sendMeasurements();
  }, [isActiveTabIndex]);

  return (
    <View
      style={styles.tab}
      ref={tabRef}
      onLayout={() => {
        if (isActiveTabIndex) sendMeasurements();
      }}
    >
      <TouchableOpacity
        onPress={sendMeasurements}
        hitSlop={hitSlop}
        style={{ marginHorizontal: layout.spacing }}
      >
        <Text>{name}</Text>
      </TouchableOpacity>
    </View>
  );
});

// This component should receive the selected tab measurements as props
function Indicator({
  selectedTabMeasurements,
}: {
  selectedTabMeasurements: SharedValue<MeasuredDimensions | null>;
}) {
  const stylez = useAnimatedStyle(() => {
    if (!selectedTabMeasurements?.value) return {};

    const { x, width } = selectedTabMeasurements.value;

    return {
      left: withTiming(x),
      bottom: 0,
      width: withTiming(width),
    };
  });

  return <Animated.View style={[styles.indicator, stylez]} />;
}

export function DynamicTabsLesson({
  selectedTabIndex = 0,
  onChangeTab,
}: {
  selectedTabIndex?: number;
  // Call this function when the tab changes
  // Don't forget to check if the function exists before calling it
  onChangeTab?: (index: number) => void;
}) {
  const tabMeasurements = useSharedValue<MeasuredDimensions | null>(null);
  const scrollViewRef = useAnimatedRef<ScrollView>();

  const scrollToTab = (index: number) => {
    runOnUI(() => {
      const scrollViewDimensions: MeasuredDimensions = measure(scrollViewRef);

      if (!scrollViewDimensions || !tabMeasurements.value) {
        return;
      }

      scrollTo(
        scrollViewRef,
        tabMeasurements.value.x -
          (scrollViewDimensions.width - tabMeasurements.value.width) / 2,
        0,
        true
      );

      if (onChangeTab) {
        runOnJS(onChangeTab)(index);
      }
    })();
  };

  return (
    <Container>
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.scrollViewContainer}
        ref={scrollViewRef}
      >
        {tabsList.map((tab, index) => (
          <Tab
            key={`tab-${tab}-${index}`}
            name={tab}
            isActiveTabIndex={index === selectedTabIndex}
            onActive={(measurements) => {
              tabMeasurements.value = measurements;
              scrollToTab(index);
            }}
          />
        ))}
        <Indicator selectedTabMeasurements={tabMeasurements} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    backgroundColor: colorShades.purple.base,
    height: 4,
    borderRadius: 2,
    bottom: 0,
    left: 0,
    width: 100,
  },
  tab: {
    marginHorizontal: layout.spacing,
  },
  scrollViewContainer: {
    paddingVertical: layout.spacing * 2,
  },
});
