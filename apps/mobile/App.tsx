import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SurveyListScreen } from "./src/screens/SurveyListScreen";
import { CaptureScreen } from "./src/screens/CaptureScreen";
import type { SurveyTask } from "./src/api";
import { theme } from "./src/theme";

/**
 * BioCoda Field: the ecologist verification app. Two screens, no nav
 * library: the targeted survey worklist and the condition-capture form.
 */
export default function App() {
  const [active, setActive] = useState<SurveyTask | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>BioCoda</Text>
        <Text style={styles.headerSub}>Field verification</Text>
      </View>
      {active ? (
        <CaptureScreen
          task={active}
          onBack={() => setActive(null)}
          onDone={() => {
            setActive(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      ) : (
        <SurveyListScreen key={refreshKey} onOpen={setActive} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: {
    backgroundColor: theme.moss,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "#c7f0d8", fontSize: 12 },
});
