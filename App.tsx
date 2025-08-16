import React from "react";
import { View, StyleSheet } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
// import GoalScreen from "./src/screens/GoalScreen"; // ⬅ comment out

export default function App() {
  // const [screen, setScreen] = useState<"home" | "goal">("home"); // ⬅ comment out

  return (
    <View style={styles.container}>
      {/* Always render HomeScreen for now */}
      <HomeScreen goToGoal={() => {}} />
      {/*
      {screen === "home" ? (
        <HomeScreen goToGoal={() => setScreen("goal")} />
      ) : (
        <GoalScreen goBack={() => setScreen("home")} />
      )}
      */}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
