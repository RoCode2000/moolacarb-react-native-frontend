import React from "react";
import { ScrollView, View, Pressable, StyleSheet, Dimensions } from "react-native";
import CalorieGoal from "../components/CalorieGoal";
import MealRecom from "../components/MealRecom";
import MealLog, { FoodEntry } from "../components/MealLog";
import ExerciseLog, { ExerciseEntry } from "../components/ExerciseLog";
import { colors } from "../theme/colors";
import { auth } from '../config/firebaseConfig';

const W = Dimensions.get("window").width;

export default function HomeScreen({ goToGoal }: { goToGoal: () => void }) {
  const consumed = 1200;
  const goal = 2000;
  const user = auth.currentUser;

  const recs = [
    { id: "1", name: "Grilled Chicken", kcal: 320 },
    { id: "2", name: "Salad",           kcal: 180 },
    { id: "3", name: "Tuna Sandwich",   kcal: 410 },
  ];

  const foods: FoodEntry[] = [
    { id: "f1", name: "Apple",        kcal: 95 },
    { id: "f2", name: "Kaya Toast",   kcal: 325 },
  ];

  const exercises: ExerciseEntry[] = [
    // { id: "e1", name: "Jogging 30 min", kcal: 220 },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.canvas}>
        {/* Instead of Pressable: */}
        {/* <Pressable onPress={goToGoal}> */}
          <CalorieGoal consumed={consumed} goal={goal} />
        {/* </Pressable> */}



        <MealRecom width={W} items={recs} />
        <MealLog items={foods} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />
        <ExerciseLog items={exercises} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, padding: 16, backgroundColor: colors.bgPrimary },
});
