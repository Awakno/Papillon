import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

import { screenOptions } from "@/utils/theme/ScreenOptions";
import { runsIOS26 } from "@/ui/utils/IsLiquidGlass";

export default function Layout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: t("Tab_Grades"),
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="grade"
        options={{
          headerShown: true,
          headerTitle: t("Modal_Grades_Title"),
          headerTransparent: runsIOS26() ? true : false,
          headerLargeTitle: false,
          presentation: "modal"
        }}
      />
    </Stack>
  );
}
