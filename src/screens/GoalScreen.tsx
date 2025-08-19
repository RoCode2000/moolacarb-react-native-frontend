import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function GoalScreen({ goBack }: { goBack: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Goal</Text>
        <View style={{ width: 64 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.goalText}>Daily Calorie Goal</Text>
        <Text style={styles.goalText}>Today's Calorie Intake</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#ccc",
  },
  backBtn: { padding: 8 },
  backTxt: { fontSize: 16, color: "#007AFF" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },
  goalText: { fontSize: 16, marginBottom: 10, color: colors.textDark },
});
