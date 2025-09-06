// src/screens/EditProfileScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth } from "../config/firebaseConfig";
import { useUser } from "../context/UserContext";

export default function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useUser();

  // Pre-fill from context (defensive: fallbacks if backend fields are missing)
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

  // If your /me response doesn’t include currentWeight/currentHeight,
  // these stay blank until the user enters something new.
  const [weight, setWeight] = useState<string>(user?.currentWeight?.toString?.() ?? "");
  const [height, setHeight] = useState<string>(user?.currentHeight?.toString?.() ?? "");

  const [goal, setGoal] = useState<string | null>(user?.goals ?? null);
  const [timeframe, setTimeframe] = useState<number | null>(user?.timeframe ?? null);

  // Date bounds (no future DOB; adjust min year if needed)
  const today = new Date();
  const minDate = new Date(1900, 0, 1);
  const maxDate = today;

  // Android date picker visibility (iOS renders inline)
  const [showPicker, setShowPicker] = useState<boolean>(Platform.OS === "ios");

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

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Only send numeric values if provided
    const weightNum = weight === "" ? undefined : Number(weight);
    const heightNum = height === "" ? undefined : Number(height);

    const payload: any = {
      firebaseId: currentUser.uid,
      gender,
      dob: dob.toISOString(),
      exercise,
      goal,
      timeframe,
    };
    if (weightNum !== undefined) payload.weight = weightNum;
    if (heightNum !== undefined) payload.height = heightNum;

    try {
      const resp = await fetch("http://10.0.2.2:8080/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || "Profile update failed");
      }

      // Refresh user from backend so context stays in sync
      const me = await fetch(`http://10.0.2.2:8080/api/user/me/${currentUser.uid}`);
      if (me.ok) {
        const backendUser = await me.json();
        setUser(backendUser);
      }

      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Update failed", e?.message ?? "Please try again.");
    }
  };

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

      {/* DOB (native picker: iOS inline, Android modal) */}
      <Text style={styles.label}>Date of Birth</Text>
      {Platform.OS === "ios" ? (
        <View style={styles.pickerBox}>
          <DateTimePicker
            value={dob}
            mode="date"
            display="inline" // iOS 14+
            maximumDate={maxDate}
            minimumDate={minDate}
            onChange={(_, selectedDate) => {
              if (selectedDate) setDob(selectedDate);
            }}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.option}
            onPress={() => setShowPicker(true)}
          >
            <Text>{formatDate(dob)}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display="calendar" // or "spinner"
              maximumDate={maxDate}
              minimumDate={minDate}
              onChange={(event, selectedDate) => {
                setShowPicker(false); // close Android modal either way
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
      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
        placeholder="e.g. 70"
      />

      {/* Height */}
      <Text style={styles.label}>Height (cm)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
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
        style={[styles.saveBtn, savingDisabled && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={savingDisabled}
      >
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 },
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
