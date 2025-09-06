import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  LayoutChangeEvent,
  Alert,
} from "react-native";
import { colors } from "../theme/colors";
import { BASE_URL } from "../config/api";
import { useUser } from "../context/UserContext";
import { auth } from "../config/firebaseConfig";
import AddEditMealModal from "../components/AddEditMealModal";
import GroupedMealLog from "../components/GroupedMealLog";

type MealItem = {
  id: string;
  name: string;
  kcal: number;
  time: Date;
  remarks?: string;
  // Macros - currently hardcoded
  protein?: number;
  carbs?: number;
  fat?: number;
};

type ApiMeal = {
  mealLogId: number;
  foodsConsumed: string;
  calories: number;
  remarks?: string;
  timeConsumed: string;
  // Macros - currently hardcoded
  protein?: number;
  carbs?: number;
  fat?: number;
};

const DEFAULT_GOAL = 2000;
const CHART_H = 160;
const BAR_W = 14;
const GAP = 8;
const SHOW_SHARE_PERCENT = false;

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDayTitle(d: Date) {
  const dd  = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS[d.getMonth()];
  const yyyy = d.getFullYear();
  const wk = WEEKDAYS[d.getDay()];
  return `${dd} ${mon} ${yyyy} (${wk})`;
}
function fmtMonthTitle({ y, m }: { y: number; m: number }) {
  return `${MONTHS[m]} ${y}`;
}
function fmtDayShort(d: Date) {
  const dd  = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS[d.getMonth()];
  return `${dd} ${mon}`;
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function startOfWeekMonday(d: Date) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day); //  so Monday is start
  const s = new Date(d);
  s.setDate(d.getDate() + diff);
  return startOfDay(s);
}
function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 0, 0, 0, 0);
}
function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}
function fmtWeekTitle(rangeStart: Date) {
  const rangeEnd = addDays(rangeStart, 6);
  const sameMonth = rangeStart.getMonth() === rangeEnd.getMonth();
  const sameYear = rangeStart.getFullYear() === rangeEnd.getFullYear();
  if (sameMonth && sameYear) {
    return `${fmtDayShort(rangeStart)} – ${String(rangeEnd.getDate()).padStart(2, "0")} ${MONTHS[rangeEnd.getMonth()]} ${rangeEnd.getFullYear()}`;
  }
  return `${fmtDayShort(rangeStart)} ${rangeStart.getFullYear()} – ${fmtDayShort(rangeEnd)} ${rangeEnd.getFullYear()}`;
}

function parseLocalDateTime(s: string): Date {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return new Date(s);
  const [_, y, mo, d, h, mi, se] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, se); // local
}
function ymdKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Report() {
  const { user } = useUser();
  const userId = user?.firebaseId ?? auth.currentUser?.uid ?? null;

  const [items, setItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [cursorDay, setCursorDay] = useState<Date>(startOfDay(new Date()));

  const today = new Date();
  const [cursorMonth, setCursorMonth] = useState<{ y: number; m: number }>({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [cursorWeekStart, setCursorWeekStart] = useState<Date>(startOfWeekMonday(today));

  // Modal (Food Diary add/edit)
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MealItem | null>(null);
  const [seedDate, setSeedDate] = useState<Date | undefined>(undefined);

  /** ===== Data Fetch ===== */
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${BASE_URL}/api/meallogs/by-firebase/${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ApiMeal[] = await res.json();
      const mapped: MealItem[] = data.map((m) => ({
        id: String(m.mealLogId),
        name: m.foodsConsumed ?? "(Unnamed)",
        kcal: Number(m.calories ?? 0),
        remarks: m.remarks ?? undefined,
        time: parseLocalDateTime(m.timeConsumed),
        protein: m.protein ?? undefined,
        carbs: m.carbs ?? undefined,
        fat: m.fat ?? undefined,
      }));

      mapped.sort((a, b) => b.time.getTime() - a.time.getTime());
      setItems(mapped);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /** ===== Day-level aggregates (kcal & macros) ===== */
  type DayAgg = { kcal: number; protein: number | null; carbs: number | null; fat: number | null };
  const dayAgg = useMemo(() => {
    const map = new Map<string, DayAgg>();
    for (const it of items) {
      const key = ymdKey(it.time);
      const prev = map.get(key) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      const p = it.protein ?? null;
      const c = it.carbs ?? null;
      const f = it.fat ?? null;
      map.set(key, {
        kcal: prev.kcal + (Number.isFinite(it.kcal) ? it.kcal : 0),
        protein: p == null || prev.protein == null ? (p == null && prev.protein == null ? null : (prev.protein ?? 0) + (p ?? 0)) : prev.protein + p,
        carbs:   c == null || prev.carbs   == null ? (c == null && prev.carbs   == null ? null : (prev.carbs   ?? 0) + (c ?? 0))   : prev.carbs + c,
        fat:     f == null || prev.fat     == null ? (f == null && prev.fat     == null ? null : (prev.fat     ?? 0) + (f ?? 0))   : prev.fat + f,
      });
    }
    return map;
  }, [items]);

  const diaryItems = useMemo(
    () => items.filter((x) => isSameLocalDay(x.time, cursorDay)).sort((a, b) => a.time.getTime() - b.time.getTime()),
    [items, cursorDay]
  );
  const totalDay = useMemo(
    () => diaryItems.reduce((s, f) => s + (Number.isFinite(f.kcal) ? f.kcal : 0), 0),
    [diaryItems]
  );
  const dayKeyStr = ymdKey(cursorDay);
  const dayMacro = dayAgg.get(dayKeyStr) ?? { kcal: totalDay, protein: null, carbs: null, fat: null };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(cursorWeekStart, i)), [cursorWeekStart]);
  const weekSeries = useMemo(
    () =>
      weekDays.map(d => {
        const ag = dayAgg.get(ymdKey(d)) ?? { kcal: 0, protein: null, carbs: null, fat: null };
        return { date: d, total: ag.kcal };
      }),
    [weekDays, dayAgg]
  );
  const weekMax = useMemo(() => Math.max(DEFAULT_GOAL, ...weekSeries.map(x => x.total), 1), [weekSeries]);
  const weekSum = useMemo(() => weekSeries.reduce((s, x) => s + x.total, 0), [weekSeries]);
  const weekAvg = useMemo(() => Math.round(weekSum / 7), [weekSum]);

  const weekProtein = useMemo(() => {
    let sum = 0, seen = false;
    for (const d of weekDays) { const a = dayAgg.get(ymdKey(d)); if (a?.protein != null){ sum += a.protein; seen = true; } }
    return seen ? Math.round(sum) : null;
  }, [weekDays, dayAgg]);
  const weekCarbs = useMemo(() => {
    let sum = 0, seen = false;
    for (const d of weekDays) { const a = dayAgg.get(ymdKey(d)); if (a?.carbs != null){ sum += a.carbs; seen = true; } }
    return seen ? Math.round(sum) : null;
  }, [weekDays, dayAgg]);
  const weekFat = useMemo(() => {
    let sum = 0, seen = false;
    for (const d of weekDays) { const a = dayAgg.get(ymdKey(d)); if (a?.fat != null){ sum += a.fat; seen = true; } }
    return seen ? Math.round(sum) : null;
  }, [weekDays, dayAgg]);

  /** ===== Monthly view data ===== */
  const monthSeries = useMemo(() => {
    const { y, m } = cursorMonth;
    const n = daysInMonth(y, m);
    const arr: { key: string; day: number; total: number; date: Date }[] = [];
    for (let d = 1; d <= n; d++) {
      const dt = new Date(y, m, d, 12, 0, 0, 0);
      const key = ymdKey(dt);
      const ag = dayAgg.get(key) ?? { kcal: 0, protein: null, carbs: null, fat: null };
      arr.push({ key, day: d, total: ag.kcal, date: dt });
    }
    return arr;
  }, [cursorMonth, dayAgg]);

  const monthMax = useMemo(() => Math.max(DEFAULT_GOAL, ...monthSeries.map((x) => x.total), 1), [monthSeries]);
  const monthSum = useMemo(() => monthSeries.reduce((s, x) => s + x.total, 0), [monthSeries]);
  const monthAvg = useMemo(() => Math.round(monthSum / Math.max(1, monthSeries.length)), [monthSum, monthSeries.length]);

  const monthProtein = useMemo(() => {
    let sum = 0, seen = false;
    for (const x of monthSeries) {
      const a = dayAgg.get(x.key);
      if (a?.protein != null){ sum += a.protein; seen = true; }
    }
    return seen ? Math.round(sum) : null;
  }, [monthSeries, dayAgg]);
  const monthCarbs = useMemo(() => {
    let sum = 0, seen = false;
    for (const x of monthSeries) {
      const a = dayAgg.get(x.key);
      if (a?.carbs != null){ sum += a.carbs; seen = true; }
    }
    return seen ? Math.round(sum) : null;
  }, [monthSeries, dayAgg]);
  const monthFat = useMemo(() => {
    let sum = 0, seen = false;
    for (const x of monthSeries) {
      const a = dayAgg.get(x.key);
      if (a?.fat != null){ sum += a.fat; seen = true; }
    }
    return seen ? Math.round(sum) : null;
  }, [monthSeries, dayAgg]);

  const prevDay = () => setCursorDay((d) => addDays(d, -1));
  const nextDay = () => setCursorDay((d) => addDays(d, +1));

  const prevWeek = () => setCursorWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setCursorWeekStart((d) => addDays(d, +7));

  const prevMonth = () => setCursorMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const nextMonth = () => setCursorMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));

  const [chartWidth, setChartWidth] = useState(0);
  const onChartLayout = (e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width);
  const [selIdx, setSelIdx] = useState<number | null>(null);
  useEffect(() => setSelIdx(null), [cursorMonth, cursorWeekStart]);

  const openAddForDay = (day: Date) => {
    setEditItem(null);
    setSeedDate(day);
    setShowModal(true);
  };
  const openEdit = (id: string) => {
    const it = items.find((x) => x.id === id) ?? null;
    setEditItem(it);
    setSeedDate(undefined);
    setShowModal(true);
  };
  const handleDelete = (id: string) => {
    Alert.alert("Delete meal", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/meallogs/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchAll();
          } catch (e: any) {
            Alert.alert("Delete failed", String(e?.message ?? e));
          }
        },
      },
    ]);
  };

  const shareRows = useMemo(() => {
    if (totalDay <= 0) return [];
    return [...diaryItems]
      .sort((a, b) => b.kcal - a.kcal)
      .map((it) => {
        const pct = it.kcal > 0 ? (it.kcal / totalDay) * 100 : 0;
        return { id: it.id, name: it.name, kcal: it.kcal, pct };
      });
  }, [diaryItems, totalDay]);

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ padding: 16 }}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable style={[styles.tabBtn, tab === "daily" && styles.tabActive]} onPress={() => setTab("daily")}>
            <Text style={[styles.tabTxt, tab === "daily" && styles.tabTxtActive]}>Daily</Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, tab === "weekly" && styles.tabActive]} onPress={() => setTab("weekly")}>
            <Text style={[styles.tabTxt, tab === "weekly" && styles.tabTxtActive]}>Weekly</Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, tab === "monthly" && styles.tabActive]} onPress={() => setTab("monthly")}>
            <Text style={[styles.tabTxt, tab === "monthly" && styles.tabTxtActive]}>Monthly</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={{ color: colors.primaryBlue }}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={{ color: colors.mute, marginTop: 8 }}>No data yet — log a meal to see reports.</Text>
        ) : tab === "daily" ? (
          <>
            {/* Day header & nav */}
            <View style={styles.headerRow}>
              <Pressable onPress={prevDay} style={styles.switchBtn}><Text style={styles.switchTxt}>◀</Text></Pressable>
              <Text style={styles.title}>{fmtDayTitle(cursorDay)}</Text>
              <Pressable onPress={nextDay} style={styles.switchBtn}><Text style={styles.switchTxt}>▶</Text></Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.kpiLabel}>Total Calorie Intake</Text>
                <Text style={styles.kpiValue}>{totalDay} kcal</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.kpiLabel}>Goal</Text>
                <Text style={styles.kpiValue}>{DEFAULT_GOAL} kcal</Text>
              </View>
              <View style={styles.progressWrap}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, (totalDay / DEFAULT_GOAL) * 100)}%`,
                        backgroundColor: totalDay <= DEFAULT_GOAL ? colors.primaryGreen : colors.primaryBlue
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressTxt}>
                  {Math.min(100, Math.round((totalDay / DEFAULT_GOAL) * 100))}% of goal
                </Text>
              </View>

              {/* Macros row (if available) */}
              <View style={[styles.macrosRow, { marginTop: 10 }]}>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroVal}>{dayMacro.protein != null ? `${Math.round(dayMacro.protein)} g` : "–"}</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroVal}>{dayMacro.carbs != null ? `${Math.round(dayMacro.carbs)} g` : "–"}</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroVal}>{dayMacro.fat != null ? `${Math.round(dayMacro.fat)} g` : "–"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={[styles.kpiLabel, { marginBottom: 8 }]}>Calorie Share</Text>
              {shareRows.length === 0 ? (
                <Text style={{ color: colors.mute }}>No meals yet.</Text>
              ) : (
                <View>
                  {shareRows.map((row) => (
                    <View key={row.id} style={{ marginBottom: 10 }}>
                      <View style={styles.shareTop}>
                        <View style={styles.swatchGreen} />
                        <Text style={styles.legendTxt} numberOfLines={1}>{row.name}</Text>
                        <Text style={[styles.legendTxt, { marginLeft: "auto" }]}>
                          {row.kcal} kcal{SHOW_SHARE_PERCENT ? ` • ${Math.round(row.pct)}%` : ""}
                        </Text>
                      </View>
                      <View style={styles.shareBarBg}>
                        <View style={[styles.shareBarFill, { width: `${Math.max(4, row.pct)}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Meal Log</Text>
              <Pressable onPress={() => openAddForDay(cursorDay)} style={[styles.switchBtn, styles.addBtn]}>
                <Text style={[styles.switchTxt, { color: colors.primaryGreen }]}>＋</Text>
              </Pressable>
            </View>

            {diaryItems.length === 0 ? (
              <Text style={{ color: colors.mute, marginBottom: 8 }}>No meals for this day.</Text>
            ) : (
              <GroupedMealLog
                items={diaryItems}
                onEdit={openEdit}
                onDelete={handleDelete}
                showTopBar={false}
              />
            )}
          </>
        ) : tab === "weekly" ? (
          <>
            <View style={styles.headerRow}>
              <Pressable onPress={prevWeek} style={styles.switchBtn}><Text style={styles.switchTxt}>◀</Text></Pressable>
              <Text style={styles.title}>{fmtWeekTitle(cursorWeekStart)}</Text>
              <Pressable onPress={nextWeek} style={styles.switchBtn}><Text style={styles.switchTxt}>▶</Text></Pressable>
            </View>

            {/* Weekly KPIs + macros */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.kpiLabel}>Weekly Total</Text>
                <Text style={styles.kpiValue}>{weekSum} kcal</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.kpiLabel}>Daily Avg</Text>
                <Text style={styles.kpiValue}>{weekAvg} kcal</Text>
              </View>

              <View style={[styles.macrosRow, { marginTop: 10 }]}>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroVal}>{weekProtein != null ? `${weekProtein} g` : "–"}</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroVal}>{weekCarbs != null ? `${weekCarbs} g` : "–"}</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroVal}>{weekFat != null ? `${weekFat} g` : "–"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.chartCard} onLayout={(e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width)}>
              <Text style={styles.chartLegend}>Tap a bar to preview • Long-press to open the diary</Text>
              <View style={{ width: "100%" }}>
                <View
                  style={[
                    styles.goalLine,
                    { bottom: (DEFAULT_GOAL / weekMax) * CHART_H },
                  ]}
                />
                <View style={[styles.chartRow, { height: CHART_H, justifyContent: "space-between" }]}>
                  {weekSeries.map((d, i) => {
                    const h = Math.max(2, Math.round((d.total / weekMax) * CHART_H));
                    const selected = selIdx === i;
                    return (
                      <View key={i} style={{ width: BAR_W, alignItems: "center" }}>
                        <Pressable
                          onPress={() => setSelIdx((prev) => (prev === i ? null : i))}
                          onLongPress={() => { setCursorDay(startOfDay(d.date)); setTab("daily"); }}
                          style={{ alignItems: "center" }}
                        >
                          {selected && (
                            <View style={styles.valueBubble}>
                              <Text style={styles.valueBubbleTxt}>{d.total}</Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.bar,
                              { height: h, backgroundColor: selected ? colors.primaryBlue : colors.primaryGreen },
                            ]}
                          />
                        </Pressable>
                        <Text style={styles.barLabel}>{WEEKDAYS[d.date.getDay()]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {selIdx != null ? (
              <>
                <View style={[styles.headerRow, { marginTop: 16 }]}>
                  <Text style={[styles.title, { textAlign: "left" }]}>{fmtDayTitle(weekSeries[selIdx].date)}</Text>
                  <Pressable
                    onPress={() => openAddForDay(startOfDay(weekSeries[selIdx].date))}
                    style={[styles.switchBtn, styles.addBtn]}
                  >
                    <Text style={[styles.switchTxt, { color: colors.primaryGreen }]}>＋</Text>
                  </Pressable>
                </View>

                <GroupedMealLog
                  items={items
                    .filter((x) => isSameLocalDay(x.time, weekSeries[selIdx].date))
                    .sort((a, b) => a.time.getTime() - b.time.getTime())
                  }
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  showTopBar={false}
                />
              </>
            ) : (
              <Text style={{ color: colors.mute, marginTop: 8, textAlign: "center" }}>
                Tap a bar to view that day’s meals here.
              </Text>
            )}
          </>
        ) : (
          <>
            {/* Month header & nav */}
            <View style={styles.headerRow}>
              <Pressable onPress={prevMonth} style={styles.switchBtn}><Text style={styles.switchTxt}>◀</Text></Pressable>
              <Text style={styles.title}>{fmtMonthTitle(cursorMonth)}</Text>
              <Pressable onPress={nextMonth} style={styles.switchBtn}><Text style={styles.switchTxt}>▶</Text></Pressable>
            </View>

            {/* Monthly KPIs + macros */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.kpiLabel}>Total for Month</Text>
                <Text style={styles.kpiValue}>{monthSum} kcal</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.kpiLabel}>Daily Average</Text>
                <Text style={styles.kpiValue}>{monthAvg} kcal</Text>
              </View>

              <View style={[styles.macrosRow, { marginTop: 10 }]}>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroVal}>{monthProtein != null ? `${monthProtein} g` : "–"}</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroVal}>{monthCarbs != null ? `${monthCarbs} g` : "–"}</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroVal}>{monthFat != null ? `${monthFat} g` : "–"}</Text>
                </View>
              </View>
            </View>

            {/* Monthly scrollable bar chart */}
            <View style={styles.chartCard} onLayout={(e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width)}>
              <Text style={styles.chartLegend}>Tap a bar to preview • Long-press to open the diary</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ width: Math.max(chartWidth, monthSeries.length * (BAR_W + GAP) - GAP) }}>
                  <View
                    style={[
                      styles.goalLine,
                      { bottom: (DEFAULT_GOAL / monthMax) * CHART_H },
                    ]}
                  />
                  <View style={[styles.chartRow, { height: CHART_H }]}>
                    {monthSeries.map((d, i) => {
                      const h = Math.max(2, Math.round((d.total / monthMax) * CHART_H));
                      const selected = selIdx === i;
                      return (
                        <View key={d.key} style={{ width: BAR_W + GAP, alignItems: "center" }}>
                          <Pressable
                            onPress={() => setSelIdx((prev) => (prev === i ? null : i))}
                            onLongPress={() => { setCursorDay(startOfDay(d.date)); setTab("daily"); }}
                            style={{ alignItems: "center" }}
                          >
                            {selected && (
                              <View style={styles.valueBubble}>
                                <Text style={styles.valueBubbleTxt}>{d.total}</Text>
                              </View>
                            )}
                            <View
                              style={[
                                styles.bar,
                                { height: h, backgroundColor: selected ? colors.primaryBlue : colors.primaryGreen },
                              ]}
                            />
                          </Pressable>
                          <Text style={styles.barLabel}>{d.day}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>

            {selIdx != null ? (
              <>
                <View style={[styles.headerRow, { marginTop: 16 }]}>
                  <Text style={[styles.title, { textAlign: "left" }]}>
                    {fmtDayTitle(new Date(cursorMonth.y, cursorMonth.m, monthSeries[selIdx].day))}
                  </Text>
                  <Pressable
                    onPress={() => openAddForDay(startOfDay(monthSeries[selIdx].date))}
                    style={[styles.switchBtn, styles.addBtn]}
                  >
                    <Text style={[styles.switchTxt, { color: colors.primaryGreen }]}>＋</Text>
                  </Pressable>
                </View>

                <GroupedMealLog
                  items={items
                    .filter((x) => isSameLocalDay(x.time, monthSeries[selIdx].date))
                    .sort((a, b) => a.time.getTime() - b.time.getTime())
                  }
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  showTopBar={false}
                />
              </>
            ) : (
              <Text style={{ color: colors.mute, marginTop: 8, textAlign: "center" }}>
                Tap a bar to view that day’s meals here.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit modal */}
      {userId && (
        <AddEditMealModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSaved={fetchAll}
          userId={userId}
          baseUrl={BASE_URL}
          initial={editItem}
          defaultDate={seedDate}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.bgLighter,
    borderWidth: 1,
    borderColor: colors.bgLighter,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.bgLightest },
  tabTxt: { color: colors.primaryBlue, fontWeight: "700", opacity: 0.6 },
  tabTxtActive: { color: colors.primaryBlue, opacity: 1 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  listHeader: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 8 },
  title: { color: colors.primaryBlue, fontWeight: "800", fontSize: 16, flex: 1, textAlign: "center" },
  switchBtn: {
    width: 36, height: 32, borderRadius: 8,
    borderWidth: 1, borderColor: colors.bgLightest,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.bgPrimary,
  },
  addBtn: {
    marginLeft: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryBlue, alignItems: "center", justifyContent: "center"
  },
  switchTxt: { color: colors.primaryBlue, fontWeight: "800" },

  sectionTitle: {
    color: colors.primaryBlue, fontWeight: "800", fontSize: 16, flex: 1,
  },

  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bgLightest,
    padding: 12,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.mute,
  },

  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  kpiLabel: { color: colors.primaryBlue, fontWeight: "700", opacity: 0.7 },
  kpiValue: { color: colors.primaryBlue, fontWeight: "800" },

  progressWrap: { marginTop: 6 },
  progressBarBg: {
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.bgLighter,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.bgLighter,
  },
  progressBarFill: { height: 10, backgroundColor: colors.primaryGreen },
  progressTxt: { marginTop: 6, color: colors.primaryBlue, fontWeight: "700", opacity: 0.7 },

  // Macros - currently hardcoded
  macrosRow: { flexDirection: "row", gap: 12 },
  macroCol: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: colors.bgLighter },
  macroLabel: { color: colors.primaryBlue, opacity: 0.7, fontWeight: "700", fontSize: 12 },
  macroVal: { color: colors.primaryBlue, fontWeight: "800", fontSize: 14, marginTop: 2 },

  shareTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  shareBarBg: {
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.bgLighter,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.bgLighter,
  },
  shareBarFill: { height: 8, backgroundColor: colors.primaryGreen },
  swatchGreen: {
    width: 10, height: 10, borderRadius: 2,
    backgroundColor: colors.primaryGreen,
  },
  legendTxt: { color: colors.primaryBlue, fontSize: 12, fontWeight: "700" },

  chartLegend: { color: colors.primaryBlue, fontSize: 12, marginBottom: 8, textAlign: "center", opacity: 0.7 },
  chartRow: { flexDirection: "row", alignItems: "flex-end" },
  bar: { width: BAR_W, borderRadius: 4, backgroundColor: colors.primaryGreen },
  barLabel: { fontSize: 10, color: colors.primaryBlue, marginTop: 4, textAlign: "center", opacity: 0.7 },
  goalLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: colors.bgMidLight },

  valueBubble: {
    position: "absolute",
    bottom: CHART_H + 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.bgLightest,
  },
  valueBubbleTxt: { fontSize: 10, color: colors.primaryBlue, fontWeight: "800" },
});
