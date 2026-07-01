import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  fetchParcel,
  submitVerification,
  type Band,
  type ParcelDetail,
  type SurveyTask,
} from "../api";
import { bandColor, theme } from "../theme";

const BANDS: Band[] = ["poor", "moderate", "good"];

/**
 * Capture a condition assessment against a parcel: Defra band, notes, photo
 * count, and a geotag. The geotag defaults to the parcel centroid (a real
 * device uses GPS); submitting reconciles the field truth with EO and closes
 * the survey task.
 */
export function CaptureScreen({
  task,
  onDone,
  onBack,
}: {
  task: SurveyTask;
  onDone: () => void;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<ParcelDetail | null>(null);
  const [condition, setCondition] = useState<Band>("moderate");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchParcel(task.parcelId).then(setDetail).catch(() => setDetail(null));
  }, [task.parcelId]);

  async function submit() {
    if (!detail) return;
    setSubmitting(true);
    try {
      const [lng, lat] = detail.parcel.centroid;
      await submitVerification({
        parcelId: task.parcelId,
        condition,
        notes,
        photos: Array.from({ length: photos }, (_, i) => `photo-${i + 1}.jpg`),
        lng,
        lat,
      });
      Alert.alert("Verification filed", "EO reconciled and survey task closed.", [
        { text: "OK", onPress: onDone },
      ]);
    } catch (e) {
      Alert.alert("Submit failed", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>‹ Worklist</Text>
      </TouchableOpacity>
      <Text style={styles.h1}>{task.parcelName}</Text>
      <Text style={styles.sub}>{task.habitatType}</Text>

      {detail && (
        <View style={styles.eoCard}>
          <Text style={styles.eoLabel}>EO estimate (Year {detail.trajectory.year})</Text>
          <Text style={styles.eoValue}>
            actual {detail.trajectory.actual.toFixed(2)} · required{" "}
            {detail.trajectory.required.toFixed(2)} · gap {detail.trajectory.gap.toFixed(2)}
          </Text>
          <Text style={styles.eoNote}>
            Your assessment is authoritative and overrides the EO signal.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Condition assessment</Text>
      <View style={styles.bandRow}>
        {BANDS.map((b) => (
          <TouchableOpacity
            key={b}
            onPress={() => setCondition(b)}
            style={[
              styles.band,
              { borderColor: bandColor[b] },
              condition === b && { backgroundColor: bandColor[b] },
            ]}
          >
            <Text
              style={[
                styles.bandText,
                { color: condition === b ? "#fff" : bandColor[b] },
              ]}
            >
              {b}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes (condition criteria)</Text>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder="Sward height, indicator species, scrub encroachment…"
        value={notes}
        onChangeText={setNotes}
      />

      <Text style={styles.label}>Photos</Text>
      <View style={styles.bandRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={() => setPhotos((n) => n + 1)}>
          <Text style={styles.photoBtnText}>+ Add geotagged photo</Text>
        </TouchableOpacity>
        <Text style={styles.photoCount}>{photos} attached</Text>
      </View>

      {detail && (
        <Text style={styles.geo}>
          Geotag: {detail.parcel.centroid[1].toFixed(5)}, {detail.parcel.centroid[0].toFixed(5)}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.submit, (!detail || submitting) && { opacity: 0.5 }]}
        onPress={submit}
        disabled={!detail || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>File verification</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.bg },
  back: { color: theme.moss, marginBottom: 8, fontSize: 15 },
  h1: { fontSize: 22, fontWeight: "700", color: theme.ink },
  sub: { color: theme.muted, marginBottom: 12 },
  eoCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  eoLabel: { fontSize: 12, fontWeight: "600", color: theme.risk },
  eoValue: { color: theme.ink, marginTop: 2 },
  eoNote: { color: theme.muted, fontSize: 12, marginTop: 4 },
  label: { fontSize: 13, fontWeight: "600", color: theme.ink, marginTop: 8, marginBottom: 6 },
  bandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  band: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  bandText: { fontWeight: "700", textTransform: "capitalize" },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
  },
  photoBtn: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
  },
  photoBtnText: { color: theme.moss, fontWeight: "600" },
  photoCount: { color: theme.muted },
  geo: { color: theme.muted, fontSize: 12, marginTop: 12 },
  submit: {
    backgroundColor: theme.moss,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
