// src/screens/OnboardingScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth } from "../config/firebaseConfig";
import { useUser } from "../context/UserContext";

type Props = {
  navigation: any;
  route: any;
  onOnboardingComplete: () => void;
};

export default function OnboardingScreen({ onOnboardingComplete }: Props) {
  const [step, setStep] = useState(1);
  const { setUser } = useUser();

  // User inputs
  const [gender, setGender] = useState<string | null>(null);
  const [dob, setDob] = useState<Date>(new Date(2000, 0, 1));
  const [exercise, setExercise] = useState<string | null>(null);
  const [weight, setWeight] = useState<string>(""); // kg
  const [height, setHeight] = useState<string>(""); // cm
const [goal, setGoal] = useState<string | null>(null);
const [timeframe, setTimeframe] = useState<number | null>(null);

  const handleSubmit = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const payload = {
      firebaseId: currentUser.uid,
      gender,
      dob: dob.toISOString(),
      exercise,
      weight: parseFloat(weight),
      height: parseFloat(height),
      goal,
      timeframe,
    };


    console.log("Submitting onboarding data:", payload);

    const response = await fetch("http://10.0.2.2:8080/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Onboarding failed:", err);
      return;
    }

    // fetch updated user
    const userResponse = await fetch(
      `http://10.0.2.2:8080/api/user/me/${currentUser.uid}`
    );

    if (!userResponse.ok) {
      console.error("Failed to fetch user after onboarding");
      return;
    }

    const backendUser = await userResponse.json();
    console.log("Fetched user after onboarding:", backendUser);

    setUser(backendUser);
    onOnboardingComplete();
  };

  return (
    <View style={styles.container}>
      {/* STEP 1 - Gender */}
      {step === 1 && (
        <>
          <Text style={styles.title}>What is your gender at birth?</Text>
          <TouchableOpacity style={styles.option} onPress={() => setGender("Male")}>
            <Text>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => setGender("Female")}>
            <Text>Female</Text>
          </TouchableOpacity>
          {gender && (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* STEP 2 - DOB */}
      {step === 2 && (
        <>
          <Text style={styles.title}>When is your date of birth?</Text>
          <DateTimePicker
            value={dob}
            mode="date"
            display="spinner"
            onChange={(e, selected) => selected && setDob(selected)}
          />
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </>
      )}

      {/* STEP 3 - Exercise */}
      {step === 3 && (
        <>
          <Text style={styles.title}>How often do you exercise?</Text>
          {["Never", "1–2x/week", "3–5x/week", "Daily"].map((opt) => (
            <TouchableOpacity key={opt} style={styles.option} onPress={() => setExercise(opt)}>
              <Text>{opt}</Text>
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
            placeholder="Enter weight in kg"
          />
          {weight && (
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
            placeholder="Enter height in cm"
          />
          {height && (
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
    {["Lose Weight", "Maintain Weight", "Gain Muscle", "Improve Overall Health"].map((g) => (
      <TouchableOpacity key={g} style={styles.option} onPress={() => setGoal(g)}>
        <Text>{g}</Text>
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
    {[1, 3, 6, 12].map((months) => (
      <TouchableOpacity key={months} style={styles.option} onPress={() => setTimeframe(months)}>
        <Text>{months} Month{months > 1 ? "s" : ""}</Text>
      </TouchableOpacity>
    ))}
    {timeframe && (
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    )}
  </>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 20, textAlign: "center" },
  option: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  nextBtn: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    width: "60%",
    alignItems: "center",
  },
  nextText: { color: "white", fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: "80%",
    padding: 12,
    textAlign: "center",
    marginVertical: 10,
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: "#0f2b3a",
    padding: 14,
    borderRadius: 10,
    width: "70%",
    alignItems: "center",
  },
  submitText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
