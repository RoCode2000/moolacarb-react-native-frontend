// src/components/AddEditMealModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet, Platform, Alert
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { colors } from "../theme/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;  // Firebase UID
  baseUrl: string; // e.g. http://localhost:8080
  initial?: {
    id: string;
    name: string;
    kcal: number;
    time: Date;          // <-- just a Date here
    remarks?: string;
  } | null;
};

export default function AddEditMealModal({
  visible, onClose, onSaved, userId, baseUrl, initial
}: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState("");
  const [kcal, setKcal] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [dt, setDt] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  // Single-trigger pickers
  const [showPicker, setShowPicker] = useState(false);      // iOS (datetime) / Android (date step)
  const [showTimeStep, setShowTimeStep] = useState(false);  // Android only (time step)

  // Normalize to a true "local wall time" Date (prevents hidden UTC offset weirdness)
  const normalizeLocal = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), 0);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? "");
    setKcal(initial?.kcal != null ? String(initial.kcal) : "");
    setRemarks(initial?.remarks ?? "");

    // If the caller (HomeScreen) parsed as local, this will preserve the exact wall time.
    const seed = initial?.time ?? new Date();
    setDt(normalizeLocal(seed));

    setShowPicker(false);
    setShowTimeStep(false);
  }, [visible, initial]);

  function toIsoNoZ(d: Date) {
    const pad = (n:number) => String(n).padStart(2,"0");
    const y = d.getFullYear(), m = pad(d.getMonth()+1), day = pad(d.getDate());
    const h = pad(d.getHours()), min = pad(d.getMinutes()), s = pad(d.getSeconds());
    return `${y}-${m}-${day}T${h}:${min}:${s}`;
  }


  function fmtLocalDateTime(d: Date) {
    return d.toLocaleString("en-SG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Singapore",
    });
  }

  // iOS: single datetime picker
  const onChangeIOS = (_e: DateTimePickerEvent, val?: Date) => {
    if (val) setDt(normalizeLocal(val));
  };

  const onChangeAndroidDate = (e: DateTimePickerEvent, val?: Date) => {
    setShowPicker(false);
    if (e.type !== "set" || !val) return;
    const merged = new Date(dt);
    merged.setFullYear(val.getFullYear(), val.getMonth(), val.getDate());
    setDt(merged);
    setShowTimeStep(true);
  };

  const onChangeAndroidTime = (e: DateTimePickerEvent, val?: Date) => {
    setShowTimeStep(false);
    if (e.type !== "set" || !val) return;

    const merged = new Date(dt);
    merged.setHours(val.getHours(), val.getMinutes(), 0, 0);

    setDt(merged);
  };

  const openDateTimePicker = () => {
    setDt(prev => normalizeLocal(prev));
    setShowPicker(true);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a food name.");
      return;
    }

    const body = {
      foodsConsumed: name.trim(),
      calories: Number(kcal) || 0,
      remarks: remarks.trim() || null,
      timeConsumed: toIsoNoZ(dt),
    };

    try {
      setSaving(true);

      const url = isEdit && initial
        ? `${baseUrl}/api/meallogs/${initial.id}`
        : `${baseUrl}/api/meallogs/by-firebase/${encodeURIComponent(userId)}`;

      console.log("SAVE", isEdit ? "PUT" : "POST", url, body);

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      console.log("SAVE status:", res.status, text);
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      onSaved();
      onClose();
    } catch (e: any) {
      console.log("Save Meal error:", e?.message ?? e);
      Alert.alert("Save failed", String(e?.message ?? e));
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
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Chicken rice"
            style={styles.input}
          />

          <Text style={styles.label}>Estimated kcal</Text>
          <TextInput
            value={kcal}
            onChangeText={setKcal}
            placeholder="e.g. 550"
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Remarks</Text>
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder="optional"
            style={styles.input}
          />

          <Text style={styles.label}>Consumed on</Text>
          <View style={styles.row}>
            <Pressable style={styles.pill} onPress={openDateTimePicker}>
              <Text style={styles.pillTxt}>{fmtLocalDateTime(dt)}</Text>
            </Pressable>
          </View>

          {/* iOS: single datetime picker */}
          {showPicker && Platform.OS === "ios" && (
            <DateTimePicker
              value={dt}
              mode="datetime"
              display="inline"
              onChange={onChangeIOS}
            />
          )}

          {/* Android: date then time */}
          {showPicker && Platform.OS === "android" && (
            <DateTimePicker
              value={dt}
              mode="date"
              display="default"
              onChange={onChangeAndroidDate}
            />
          )}
          {showTimeStep && Platform.OS === "android" && (
            <DateTimePicker
              value={dt}
              mode="time"
              is24Hour={false}       // AM/PM clock on Android
              display="default"
              onChange={onChangeAndroidTime}
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
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.mute,
  },
  title: { fontWeight: "800", fontSize: 16, color: colors.primaryBlue, marginBottom: 8 },
  label: { color: colors.primaryBlue, fontWeight: "700", marginTop: 8 },
  input: {
    backgroundColor: "white",
    borderColor: colors.mute,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  row: { flexDirection: "row", alignItems: "center" },
  pill: {
    backgroundColor: colors.bgLightest,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderColor: colors.mute,
    borderWidth: 1,
  },
  pillTxt: { color: colors.primaryBlue, fontWeight: "700" },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.mute,
  },
  cancel: { backgroundColor: colors.bgPrimary, marginRight: 8 },
  save: { backgroundColor: colors.primaryBlue, marginLeft: 8 },
  btnTxt: { color: colors.primaryBlue, fontWeight: "800" },
});
