// src/screens/EditProfileScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../config/firebaseConfig";
import { useUser } from "../context/UserContext";

/** ===== API endpoints ===== */
const API_HOST = "http://10.0.2.2:8080";
const PROFILE_UPSERT = `${API_HOST}/api/user/onboarding`;
const ME_ENDPOINT = (uid: string) => `${API_HOST}/api/user/me/${uid}`;

const WEIGHT_CURRENT = (uid: string) => `${API_HOST}/api/weight/current/${uid}`;
const WEIGHT_HISTORY = (uid: string) => `${API_HOST}/api/weight/history/${uid}`;
const WEIGHT_ADD = (uid: string, w: number) =>
  `${API_HOST}/api/weight/add?firebaseId=${encodeURIComponent(uid)}&weight=${encodeURIComponent(w)}`;

const HEIGHT_CURRENT = (uid: string) => `${API_HOST}/api/height/current/${uid}`;
const HEIGHT_HISTORY = (uid: string) => `${API_HOST}/api/height/history/${uid}`;
const HEIGHT_ADD = (uid: string, h: number) =>
  `${API_HOST}/api/height/add?firebaseId=${encodeURIComponent(uid)}&height=${encodeURIComponent(h)}`;

/** Common GET options to fix 406 */
const GET_JSON: RequestInit = {
  method: "GET",
  headers: { Accept: "application/json" },
};

export default function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useUser();

  // Prefer UID from context; fall back to Firebase auth
  const uid = user?.firebaseId || auth.currentUser?.uid || null;

  // Pre-fill from context
  const [gender, setGender] = useState<string | null>(user?.gender ?? null);
  const initialDob = useMemo(() => {
    try {
      return user?.dob ? new Date(user.dob) : new Date(2000, 0, 1);
    } catch {
      return new Date(2000, 0, 1);
    }
  }, [user?.dob]);
  const [dob, setDob] = useState<Date>(initialDob);

  const [exercise, setExercise] = useState<string | null>(user?.exercise ?? null);

  const [weight, setWeight] = useState<string>(""); // will be fetched
  const [height, setHeight] = useState<string>(""); // will be fetched

  const [goal, setGoal] = useState<string | null>(user?.goals ?? null);
  const [timeframe, setTimeframe] = useState<number | null>(user?.timeframe ?? null);

  const today = new Date();
  const minDate = new Date(1900, 0, 1);
  const maxDate = today;
  const [showPicker, setShowPicker] = useState<boolean>(Platform.OS === "ios");

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMeasurements, setLoadingMeasurements] = useState<boolean>(false);

  const savingDisabled =
    !gender ||
    !dob ||
    !exercise ||
    !goal ||
    !timeframe ||
    (weight !== "" && isNaN(Number(weight))) ||
    (height !== "" && isNaN(Number(height)));

  const formatDate = (d: Date) =>
    Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);

  /** ---------- Fetch helpers ---------- */
  const parseNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const pickField = (obj: any, keys: string[]) => {
    for (const k of keys) {
      if (obj && obj[k] != null) {
        const n = parseNumber(obj[k]);
        if (n !== undefined) return n;
      }
    }
    return undefined;
  };

  const loadMeasurements = async (uid: string) => {
    setLoadingMeasurements(true);
    try {
      console.log("[EditProfile] uid:", uid);

      // ---- Weight ----
      let wVal: number | undefined;
      const wResp = await fetch(WEIGHT_CURRENT(uid), GET_JSON);
      console.log("[EditProfile] WEIGHT_CURRENT status:", wResp.status);
      if (wResp.ok) {
        const wJson = await wResp.json();
        console.log("[EditProfile] WEIGHT_CURRENT json:", wJson);
        wVal = pickField(wJson, ["weight", "value", "currentWeight"]);
      } else {
        console.warn("[EditProfile] WEIGHT_CURRENT failed:", await wResp.text());
      }
      if (wVal === undefined) {
        const wh = await fetch(WEIGHT_HISTORY(uid), GET_JSON);
        console.log("[EditProfile] WEIGHT_HISTORY status:", wh.status);
        if (wh.ok) {
          const arr = await wh.json();
          console.log("[EditProfile] WEIGHT_HISTORY json:", arr);
          if (Array.isArray(arr) && arr.length) {
            // try newest last; if API returns newest-first, the first line still works
            wVal =
              pickField(arr[arr.length - 1], ["weight", "value"]) ??
              pickField(arr[0], ["weight", "value"]);
          }
        }
      }
      if (wVal !== undefined) setWeight(String(wVal));

      // ---- Height ----
      let hVal: number | undefined;
      const hResp = await fetch(HEIGHT_CURRENT(uid), GET_JSON);
      console.log("[EditProfile] HEIGHT_CURRENT status:", hResp.status);
      if (hResp.ok) {
        const hJson = await hResp.json();
        console.log("[EditProfile] HEIGHT_CURRENT json:", hJson);
        hVal = pickField(hJson, ["height", "value", "currentHeight"]);
      } else {
        console.warn("[EditProfile] HEIGHT_CURRENT failed:", await hResp.text());
      }
      if (hVal === undefined) {
        const hh = await fetch(HEIGHT_HISTORY(uid), GET_JSON);
        console.log("[EditProfile] HEIGHT_HISTORY status:", hh.status);
        if (hh.ok) {
          const arr = await hh.json();
          console.log("[EditProfile] HEIGHT_HISTORY json:", arr);
          if (Array.isArray(arr) && arr.length) {
            hVal =
              pickField(arr[arr.length - 1], ["height", "value"]) ??
              pickField(arr[0], ["height", "value"]);
          }
        }
      }
      if (hVal !== undefined) setHeight(String(hVal));
    } catch (e) {
      console.warn("[EditProfile] loadMeasurements error:", e);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  // Load when UID first available
  useEffect(() => {
    if (uid) loadMeasurements(uid);
  }, [uid]);

  // Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      if (uid) loadMeasurements(uid);
    }, [uid])
  );

  /** ---------- Save ---------- */
  const handleSave = async () => {
    if (!uid) return;

    const weightNum = weight === "" ? undefined : Number(weight);
    const heightNum = height === "" ? undefined : Number(height);

    setLoading(true);
    try {
      const profilePayload: any = {
        firebaseId: uid,
        gender,
        dob: dob.toISOString(),
        exercise,
        goal,
        timeframe,
      };

      const profileResp = await fetch(PROFILE_UPSERT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(profilePayload),
      });
      if (!profileResp.ok) throw new Error(await profileResp.text());

      if (weightNum !== undefined && !isNaN(weightNum)) {
        await fetch(WEIGHT_ADD(uid, weightNum), { method: "POST", headers: { Accept: "application/json" } });
      }
      if (heightNum !== undefined && !isNaN(heightNum)) {
        await fetch(HEIGHT_ADD(uid, heightNum), { method: "POST", headers: { Accept: "application/json" } });
      }

      const me = await fetch(ME_ENDPOINT(uid), GET_JSON);
      if (me.ok) setUser(await me.json());

      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Update failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** ---------- Render ---------- */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {/* Gender */}
      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        {["Male", "Female"].map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.pill, gender === g && styles.pillSelected]}
            onPress={() => setGender(g)}
          >
            <Text style={styles.pillText}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DOB */}
      <Text style={styles.label}>Date of Birth</Text>
      {Platform.OS === "ios" ? (
        <View style={styles.pickerBox}>
          <DateTimePicker
            value={dob}
            mode="date"
            display="inline"
            maximumDate={maxDate}
            minimumDate={minDate}
            onChange={(_, selectedDate) => {
              if (selectedDate) setDob(selectedDate);
            }}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.option} onPress={() => setShowPicker(true)}>
            <Text>{formatDate(dob)}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display="calendar"
              maximumDate={maxDate}
              minimumDate={minDate}
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setDob(selectedDate);
              }}
            />
          )}
        </>
      )}

      {/* Exercise */}
      <Text style={styles.label}>Exercise Frequency</Text>
      {["Never", "1–2x/week", "3–5x/week", "Daily"].map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.option, exercise === opt && styles.optionSelected]}
          onPress={() => setExercise(opt)}
        >
          <Text>{opt}</Text>
        </TouchableOpacity>
      ))}

      {/* Weight */}
      <View style={styles.inlineLabel}>
        <Text style={styles.label}>Weight (kg)</Text>
        {loadingMeasurements && <ActivityIndicator />}
      </View>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        inputMode="decimal"
        value={weight}
        onChangeText={setWeight}
        placeholder="e.g. 70"
      />

      {/* Height */}
      <Text style={styles.label}>Height (cm)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        inputMode="numeric"
        value={height}
        onChangeText={setHeight}
        placeholder="e.g. 173"
      />

      {/* Goal */}
      <Text style={styles.label}>Goal</Text>
      {["Lose Weight", "Maintain Weight", "Gain Muscle", "Improve Overall Health"].map((g) => (
        <TouchableOpacity
          key={g}
          style={[styles.option, goal === g && styles.optionSelected]}
          onPress={() => setGoal(g)}
        >
          <Text>{g}</Text>
        </TouchableOpacity>
      ))}

      {/* Timeframe */}
      <Text style={styles.label}>Timeframe</Text>
      <View style={styles.rowWrap}>
        {[1, 3, 6, 12].map((months) => (
          <TouchableOpacity
            key={months}
            style={[styles.pill, timeframe === months && styles.pillSelected]}
            onPress={() => setTimeframe(months)}
          >
            <Text style={styles.pillText}>
              {months} Month{months > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, (savingDisabled || loading) && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={savingDisabled || loading}
      >
        {loading ? <ActivityIndicator /> : <Text style={styles.saveText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  inlineLabel: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
    marginVertical: 4, marginRight: 8,
  },
  pillSelected: { backgroundColor: "#e6f6ec", borderColor: "#4CAF50" },
  pillText: { fontSize: 14 },
  option: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginVertical: 6,
  },
  optionSelected: { backgroundColor: "#e6f6ec", borderColor: "#4CAF50" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12,
  },
  pickerBox: {
    borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 6, alignItems: "center",
  },
  saveBtn: {
    marginTop: 24, backgroundColor: "#0f2b3a", padding: 14, borderRadius: 10, alignItems: "center",
  },
  saveText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
