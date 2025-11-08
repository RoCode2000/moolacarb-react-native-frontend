// src/screens/OnboardingScreen.tsx
import React, { useState } from "react";
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
import DateTimePicker, { AndroidNativeProps, IOSNativeProps } from "@react-native-community/datetimepicker";
import { auth } from "../config/firebaseConfig";
import { useUser } from "../context/UserContext";
import { BASE_URL } from "../config/api";

type Props = {
  navigation?: any;
  route?: any;
  onOnboardingComplete: () => void;
};

export default function OnboardingScreen({ onOnboardingComplete }: Props) {
  const [step, setStep] = useState(1);
  const { setUser } = useUser();

  // Inputs
  const [gender, setGender] = useState<string | null>(null);
  const [dob, setDob] = useState<Date>(new Date(2000, 0, 1));
  const [exercise, setExercise] = useState<string | null>(null);
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [goal, setGoal] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<number | null>(null);

  // Date picker visibility for Android (modal); iOS renders inline
  const [showPicker, setShowPicker] = useState<boolean>(Platform.OS === "ios");

  // Date bounds (no future DOB; adjust min year if needed)
  const today = new Date();
  const minDate = new Date(1900, 0, 1);
  const maxDate = today;

  const formatDate = (d: Date) =>
    Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);

  const handleSubmit = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

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
      const response = await fetch(`${BASE_URL}/api/user/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());

      // refresh user
      const me = await fetch(`${BASE_URL}/api/user/me/${currentUser.uid}`);
      if (!me.ok) throw new Error("Failed to fetch user after onboarding");
      const backendUser = await me.json();
      setUser(backendUser);

      onOnboardingComplete();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Onboarding failed", e?.message ?? "Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* STEP 1 - Gender */}
      {step === 1 && (
        <>
          <Text style={styles.title}>What is your gender at birth?</Text>
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
          {gender && (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* STEP 2 - DOB (Native Picker: iOS inline, Android modal) */}
      {step === 2 && (
        <>
          <Text style={styles.title}>When is your date of birth?</Text>

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
                    // Android returns an event type; when dismissed, selectedDate is undefined
                    setShowPicker(false);
                    if (selectedDate) setDob(selectedDate);
                  }}
                />
              )}
            </>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </>
      )}

      {/* STEP 3 - Exercise */}
      {step === 3 && (
        <>
          <Text style={styles.title}>How often do you exercise?</Text>
          {[
            { key: "sedentary", label: "Sedentary (little or no exercise)" },
            { key: "light",     label: "Lightly active (1–3 days/week)" },
            { key: "moderate",  label: "Moderately active (3–5 days/week)" },
            { key: "very",      label: "Very active (6–7 days/week)" },
            { key: "extra",     label: "Extra active (very hard exercise/physical job)" },
          ].map((opt) => (
            <TouchableOpacity
                    key={opt.key}
                    style={[styles.option, exercise === opt.key && styles.optionSelected]}
                    onPress={() => setExercise(opt.key)}
                  >
                    <Text>{opt.label}</Text>
                  </TouchableOpacity>
                ))}

                {exercise && (
                  <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(4)}>
                    <Text style={styles.nextText}>Next</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

      {/* STEP 4 - Weight */}
      {step === 4 && (
        <>
          <Text style={styles.title}>What is your current weight (kg)?</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 70"
          />
          {!!weight && !isNaN(Number(weight)) && (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(5)}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* STEP 5 - Height */}
      {step === 5 && (
        <>
          <Text style={styles.title}>What is your current height (cm)?</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
            placeholder="e.g. 173"
          />
          {!!height && !isNaN(Number(height)) && (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(6)}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* STEP 6 - Goal */}
      {step === 6 && (
        <>
          <Text style={styles.title}>What is your main goal?</Text>
          {[
            { key: "LOSE",         label: "Lose weight" },
            { key: "MAINTAIN",     label: "Maintain weight" },
            { key: "MUSCLE",       label: "Build muscle" },
            { key: "IMPROVE",      label: "Improve Overall Health" },
          ].map((g) => (
            <TouchableOpacity
              key={g.key}
              style={[styles.option, goal === g.key && styles.optionSelected]}
              onPress={() => setGoal(g.key)}
            >
              <Text>{g.label}</Text>
            </TouchableOpacity>
          ))}

          {goal && (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(7)}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          )}
        </>
      )}


      {/* STEP 7 - Timeframe */}
      {step === 7 && (
        <>
          <Text style={styles.title}>What is your timeframe?</Text>
          <View style={styles.rowWrap}>
            {[1, 3, 6, 12].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.pill, timeframe === m && styles.pillSelected]}
                onPress={() => setTimeframe(m)}
              >
                <Text style={styles.pillText}>
                  {m} Month{m > 1 ? "s" : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {timeframe && (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16, textAlign: "center" },
  row: { flexDirection: "row", gap: 10 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  pill: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
  },
  pillSelected: { backgroundColor: "#e6f6ec", borderColor: "#4CAF50" },
  pillText: { fontSize: 14 },
  option: {
    borderWidth: 1, borderColor: "#ccc", padding: 14, borderRadius: 8, marginVertical: 6, width: "80%", alignItems: "center",
  },
  optionSelected: { backgroundColor: "#e6f6ec", borderColor: "#4CAF50" },
  nextBtn: {
    marginTop: 16, backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, width: "60%", alignItems: "center",
  },
  nextText: { color: "white", fontWeight: "bold" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 8, width: "80%", padding: 12, textAlign: "center", marginVertical: 10,
  },
  submitBtn: {
    marginTop: 16, backgroundColor: "#0f2b3a", padding: 14, borderRadius: 10, width: "70%", alignItems: "center",
  },
  submitText: { color: "white", fontWeight: "bold", fontSize: 16 },
  pickerBox: { borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 6, alignItems: "center", width: "100%" },
});
