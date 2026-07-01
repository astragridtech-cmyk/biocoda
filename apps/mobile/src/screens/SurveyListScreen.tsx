import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchTasks, type SurveyTask } from "../api";
import { theme } from "../theme";

/** Targeted survey worklist: the parcels EO has flagged for ground-truthing. */
export function SurveyListScreen({ onOpen }: { onOpen: (task: SurveyTask) => void }) {
  const [tasks, setTasks] = useState<SurveyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTasks(await fetchTasks());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.moss} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Survey worklist</Text>
      <Text style={styles.sub}>{tasks.length} parcels need field verification</Text>
      {error && <Text style={styles.error}>Couldn’t load tasks: {error}</Text>}
      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No open survey tasks. Pull to refresh.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onOpen(item)}>
            <View style={styles.rowBetween}>
              <Text style={styles.name}>{item.parcelName}</Text>
              <Text style={styles.badge}>At risk</Text>
            </View>
            <Text style={styles.habitat}>{item.habitatType}</Text>
            <Text style={styles.reason}>{item.reason}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg },
  h1: { fontSize: 22, fontWeight: "700", color: theme.ink },
  sub: { color: theme.muted, marginBottom: 12 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 10,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "600", color: theme.ink },
  badge: {
    color: theme.risk,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "#ffedd5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  habitat: { color: theme.muted, marginTop: 2 },
  reason: { color: theme.ink, marginTop: 6, fontSize: 13 },
  empty: { color: theme.muted, textAlign: "center", marginTop: 40 },
  error: { color: theme.risk, marginBottom: 8 },
});
