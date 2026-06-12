import { useState, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { BudgetsScreen } from "@/features/budgets/screens/budgets-screen";
import { GoalsScreen } from "@/features/goals/screens/goals-screen";
import { Pressable } from "react-native";

type PlanningSegment = "metas" | "orcamentos";

const SEGMENTS: readonly { readonly key: PlanningSegment; readonly label: string }[] = [
  { key: "metas", label: "Metas" },
  { key: "orcamentos", label: "Orçamentos" },
];

/**
 * Aba "Planejar" (redesign F2): Metas e Orçamentos sob um segmented
 * control — composição feita na camada de rota para não criar import
 * lateral entre features.
 */
export default function PlanningRoute(): ReactElement {
  const [segment, setSegment] = useState<PlanningSegment>("metas");

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        margin="$4"
        marginBottom="$2"
        padding="$1"
        borderRadius="$5"
        backgroundColor="$surfaceRaised"
        borderWidth={1}
        borderColor="$borderColor"
      >
        {SEGMENTS.map(({ key, label }) => {
          const isActive = segment === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              testID={`planning-segment-${key}`}
              onPress={() => setSegment(key)}
              style={{ flex: 1 }}
            >
              <YStack
                paddingVertical="$2"
                borderRadius="$5"
                backgroundColor={isActive ? "$surfaceCard" : "transparent"}
                borderWidth={isActive ? 1 : 0}
                borderColor="$borderColor"
              >
                <Paragraph
                  textAlign="center"
                  fontFamily="$body"
                  fontSize="$3"
                  fontWeight={isActive ? "$6" : "$4"}
                  color={isActive ? "$primary" : "$muted"}
                >
                  {label}
                </Paragraph>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>
      <YStack flex={1}>
        {segment === "metas" ? <GoalsScreen /> : <BudgetsScreen />}
      </YStack>
    </YStack>
  );
}
