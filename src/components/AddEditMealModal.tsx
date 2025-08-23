import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet, Platform
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from "../theme/colors";
import { Alert } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string; // Firebase UID you’re using
  baseUrl: string; // e.g. "http://localhost:8080"
  initial?: {
    id: string;
    name: string;
    kcal: number;
    time: Date;
    remarks?: string;
  } | null;
};

export default function AddEditMealModal({ visible, onClose, onSaved, userId, baseUrl, initial }: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState("");
  const [kcal, setKcal] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [dt, setDt] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setKcal(initial?.kcal != null ? String(initial.kcal) : "");
      setRemarks(initial?.remarks ?? "");
      setDt(initial?.time ?? new Date());
    }
  }, [visible, initial]);

  const onChangeDate = (_e: DateTimePickerEvent, val?: Date) => {
    setShowDate(false);
    if (!val) return;
    const merged = new Date(dt);
    merged.setFullYear(val.getFullYear(), val.getMonth(), val.getDate());
    setDt(merged);
  };
  const onChangeTime = (_e: DateTimePickerEvent, val?: Date) => {
    setShowTime(false);
    if (!val) return;
    const merged = new Date(dt);
    merged.setHours(val.getHours(), val.getMinutes(), 0, 0);
    setDt(merged);
  };

// keep this helper inside the component (or above it)
function toIsoNoZ(d: Date) {
  const pad = (n:number) => String(n).padStart(2, "0");
  const y = d.getFullYear(), m = pad(d.getMonth()+1), day = pad(d.getDate());
  const h = pad(d.getHours()), min = pad(d.getMinutes()), s = pad(d.getSeconds());
  return `${y}-${m}-${day}T${h}:${min}:${s}`; // no timezone
}

const save = async () => {
  if (!name.trim()) return;
  const body = {
    foodsConsumed: name.trim(),
    calories: Number(kcal) || 0,
    remarks: remarks.trim() || null,
    timeConsumed: toIsoNoZ(dt),   // << match DATETIME in MySQL and LocalDateTime in Java
    userId,
  };

  try {
    setSaving(true);
    const url = isEdit && initial
      ? `${baseUrl}/api/meallogs/${initial.id}`
      : `${baseUrl}/api/meallogs`;

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();               // helpful when 500 happens
    console.log("SAVE status:", res.status, text);
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

    onSaved();
    onClose();
  } catch (e) {
    console.log("Save Meal error:", e);
    // optionally Alert.alert("Save failed", String(e));
  } finally {
    setSaving(false);
  }
};


  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{isEdit ? "Edit Meal" : "Add Meal"}</Text>

          <Text style={styles.label}>Food name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Chicken rice"
                     style={styles.input} />

          <Text style={styles.label}>Estimated kcal</Text>
          <TextInput value={kcal} onChangeText={setKcal} placeholder="e.g. 550"
                     keyboardType="number-pad" style={styles.input} />

          <Text style={styles.label}>Remarks</Text>
          <TextInput value={remarks} onChangeText={setRemarks} placeholder="optional"
                     style={styles.input} />

          <Text style={styles.label}>Consumed on</Text>
          <View style={styles.row}>
            <Pressable style={styles.pill} onPress={() => setShowDate(true)}>
              <Text style={styles.pillTxt}>
                {dt.toLocaleDateString("en-SG", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </Text>
            </Pressable>
            <Pressable style={[styles.pill, { marginLeft: 8 }]} onPress={() => setShowTime(true)}>
              <Text style={styles.pillTxt}>
                {dt.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </Text>
            </Pressable>
          </View>

          {showDate && (
            <DateTimePicker
              value={dt}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onChangeDate}
            />
          )}
          {showTime && (
            <DateTimePicker
              value={dt}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeTime}
            />
          )}

          <View style={[styles.row, { marginTop: 16 }]}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose} disabled={saving}>
              <Text style={styles.btnTxt}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save]} onPress={save} disabled={saving}>
              <Text style={[styles.btnTxt, { color: colors.primaryGreen }]}>{isEdit ? "Save" : "Add"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.bgPrimary, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16, borderTopWidth: 1, borderColor: colors.mute
  },
  title: { fontWeight: "800", fontSize: 16, color: colors.primaryBlue, marginBottom: 8 },
  label: { color: colors.primaryBlue, fontWeight: "700", marginTop: 8 },
  input: {
    backgroundColor: "white", borderColor: colors.mute, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 6
  },
  row: { flexDirection: "row", alignItems: "center" },
  pill: {
    backgroundColor: colors.bgLightest, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
    borderColor: colors.mute, borderWidth: 1
  },
  pillTxt: { color: colors.primaryBlue, fontWeight: "700" },
  btn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center",
    borderWidth: 1, borderColor: colors.mute
  },
  cancel: { backgroundColor: colors.bgPrimary, marginRight: 8 },
  save: { backgroundColor: colors.primaryBlue, marginLeft: 8 },
  btnTxt: { color: colors.primaryBlue, fontWeight: "800" }
});
