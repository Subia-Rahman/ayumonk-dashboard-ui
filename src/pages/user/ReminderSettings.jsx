import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDateTimeISTShort } from "../../utils/dateTime";
import usePushNotifications from "../../hooks/usePushNotifications";
import {
  clearMutationError,
  clearSavedFlag,
  clearSnooze,
  fetchReminderSettings,
  fetchReminderLog,
  flashSaved,
  snoozeReminders,
  toggleReminderField,
  updateReminderSettings,
} from "../../store/reminderSettingsSlice";
import { ACCENT, useClientPalette } from "../../utils/clientPalette";

const C = { ...ACCENT, bg: "#0b160c", card: "#111e12", border: "#1e3d20", muted: "#6B8F60" };

const isIOSDevice = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  if (window.navigator?.standalone === true) return true;
  return false;
};

const REMINDER_TYPES = [
  {
    key: "daily_challenge",
    icon: "📋",
    label: "Daily challenge reminder",
    sub: "Fires at your set time if any challenge is uncomplete",
  },
  {
    key: "streak_alert",
    icon: "🔥",
    label: "Streak at risk alert",
    sub: "Fires at 9PM if your streak ≥ 3 days and today isn't done",
  },
  {
    key: "program_ending",
    icon: "📅",
    label: "Program ending soon",
    sub: "Once, 3 days before a KPI window closes",
  },
  {
    key: "new_program",
    icon: "🌱",
    label: "New program starting tomorrow",
    sub: "Once, day before a new KPI window opens",
  },
  {
    key: "badge_milestone",
    icon: "🏅",
    label: "Badge milestone alert",
    sub: "When you're 1 day away from a 7/14/21/30-day badge",
  },
];

const CHANNELS = [
  { id: "email", field: "email_enabled", icon: "📧", label: "Email" },
  { id: "push", field: "push_enabled", icon: "🔔", label: "Browser Push" },
  {
    id: "whatsapp",
    field: "whatsapp_enabled",
    icon: "💬",
    label: "WhatsApp",
    disabled: true,
    note: "Phase 3 — coming soon",
  },
];

const SNOOZE_OPTIONS = [
  { id: "24h", label: "24h", note: "24 hours" },
  { id: "48h", label: "48h", note: "2 days" },
  { id: "7d", label: "7d", note: "1 week" },
];

const PUSH_PLATFORM_NOTES = [
  ["Android Chrome / Edge", "✅ Works from browser tab — no home screen install needed"],
  ["iOS Safari 16.4+", "⚠️ Requires Add to Home Screen first — then works identically to native"],
  ["Desktop Chrome / Firefox", "✅ Works as desktop notification in system tray"],
  ["iOS Safari < 16.4", "❌ Not supported — use Email channel instead"],
];

const TYPE_ICONS = {
  daily_challenge: "🎯",
  streak_alert:    "🔥",
  program_ending:  "⏰",
  new_program:     "🆕",
  badge_milestone: "🏅",
};

const STATUS_COLOR = {
  sent:       C.g3,
  failed:     "#f87171",
  suppressed: "#6B8F60",
};

const pushNoteColor = (status) => {
  if (status.startsWith("✅")) return C.g3;
  if (status.startsWith("⚠️")) return C.gold;
  return "#f87171";
};

const TIME_DEBOUNCE_MS = 500;

const toApiTime = (value) => {
  if (!value) return "";
  const parts = value.split(":");
  const hh = (parts[0] || "00").padStart(2, "0");
  const mm = (parts[1] || "00").padStart(2, "0");
  const ss = (parts[2] || "00").padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

const toInputTime = (value) => {
  if (!value) return "20:00";
  const [hh = "20", mm = "00"] = value.split(":");
  return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`;
};

function Toggle({ checked, onChange, size = "md", disabled = false }) {
  const big = size === "md";
  const W = big ? 42 : 36;
  const H = big ? 24 : 20;
  const knob = big ? 18 : 16;
  const inset = big ? 3 : 2;
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: W, height: H, borderRadius: H / 2, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? C.g2 : "rgba(255,255,255,0.12)",
        position: "relative", transition: "background 0.25s",
        flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}
      aria-pressed={checked}
    >
      <span style={{
        position: "absolute", top: inset, borderRadius: knob / 2,
        width: knob, height: knob, background: "#fff",
        left: checked ? W - knob - inset : inset,
        transition: "left 0.18s", display: "block",
      }} />
    </button>
  );
}

function Notice({ tone = "info", children, onClose }) {
  const palette = {
    info:  { bg: "rgba(74,144,196,0.08)",  border: "rgba(74,144,196,0.3)",  color: C.blue },
    error: { bg: "rgba(240,80,80,0.08)",   border: "rgba(240,80,80,0.3)",   color: "#f87171" },
    warn:  { bg: "rgba(212,168,67,0.08)",  border: "rgba(212,168,67,0.3)",  color: C.gold },
  }[tone];
  return (
    <div style={{
      background: palette.bg, border: `1px solid ${palette.border}`,
      color: palette.color, borderRadius: 8, padding: "7px 12px",
      fontSize: 10, display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
    }}>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} style={{
          background: "transparent", border: "none", color: "inherit",
          cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1,
        }}>✕</button>
      )}
    </div>
  );
}

export default function ReminderSettings() {
  const dispatch = useDispatch();
  const themed = useClientPalette();

  const { data, loading, error, mutationError, saved, reminderLog, logStatus } = useSelector(
    (state) => state.reminderSettings,
  );

  const {
    supported: pushSupported,
    subscribed: pushSubscribed,
    permission: pushPermission,
    busy: pushBusy,
    error: pushError,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications();

  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pushDeniedNote, setPushDeniedNote] = useState("");
  const [timeDraft, setTimeDraft] = useState("");
  const [tzDraft, setTzDraft] = useState("");
  const timeDebounceRef = useRef(null);
  const tzAutoSetRef = useRef(false);
  const lastPushErrorRef = useRef(null);

  useEffect(() => {
    if (pushError && pushError !== lastPushErrorRef.current) {
      lastPushErrorRef.current = pushError;
      setPushDeniedNote(
        pushError.message || "Could not enable browser push. Please try again.",
      );
    }
  }, [pushError]);

  useEffect(() => { dispatch(fetchReminderSettings()); }, [dispatch]);

  // Point 8: lazy-fetch reminder log only when panel is opened for the first time
  useEffect(() => {
    if (historyOpen && logStatus === "idle") {
      dispatch(fetchReminderLog({ limit: 10 }));
    }
  }, [historyOpen, logStatus, dispatch]);

  useEffect(() => {
    if (data?.reminder_time) setTimeDraft(toInputTime(data.reminder_time));
  }, [data?.reminder_time]);

  useEffect(() => {
    if (data?.timezone) setTzDraft(data.timezone);
  }, [data?.timezone]);

  useEffect(() => {
    if (!data || tzAutoSetRef.current) return;
    if (data.timezone && data.timezone !== "UTC") { tzAutoSetRef.current = true; return; }
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && detected !== data.timezone) {
      tzAutoSetRef.current = true;
      dispatch(updateReminderSettings({ timezone: detected }));
    } else {
      tzAutoSetRef.current = true;
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = window.setTimeout(() => dispatch(clearSavedFlag()), 2500);
    return () => window.clearTimeout(timer);
  }, [saved, dispatch]);

  useEffect(() => () => {
    if (timeDebounceRef.current) window.clearTimeout(timeDebounceRef.current);
  }, []);

  const isSnoozing = useMemo(() => {
    if (!data?.snooze_until) return false;
    return new Date(data.snooze_until) > new Date();
  }, [data?.snooze_until]);

  const snoozeEnds = isSnoozing ? formatDateTimeISTShort(data.snooze_until) : null;

  const activeChannels = useMemo(() => {
    if (!data) return [];
    return [
      data.email_enabled ? "email" : null,
      data.push_enabled ? "push" : null,
      data.whatsapp_enabled ? "whatsapp" : null,
    ].filter(Boolean);
  }, [data]);

  const statusLine = useMemo(() => {
    if (!data) return loading ? "Loading…" : "Reminders are off";
    if (isSnoozing) return `⏸ Snoozed until ${snoozeEnds}`;
    if (!data.is_enabled) return "Reminders are off";
    const channels = activeChannels.join(", ") || "no channels";
    const time = (data.reminder_time || "").slice(0, 5);
    return `Active · ${channels} · ${time} ${data.timezone}`;
  }, [activeChannels, data, isSnoozing, loading, snoozeEnds]);

  const handleToggleField = (field, nextValue) => {
    dispatch(toggleReminderField({ field, value: nextValue }));
  };

  const handleChannelClick = async (channel) => {
    if (channel.disabled || !data) return;
    const current = Boolean(data[channel.field]);
    const next = !current;

    if (channel.id === "push") {
      setPushDeniedNote("");
      lastPushErrorRef.current = null;

      if (!pushSupported) {
        setPushDeniedNote(
          isIOSDevice() && !isStandaloneMode()
            ? "Open Ayumonk in Safari and use Add to Home Screen to enable Browser Push."
            : "Browser Push is not supported on this device. Use Email instead.",
        );
        return;
      }

      if (next) {
        const sub = await subscribeToPush();
        if (!sub) {
          if (!pushDeniedNote) {
            setPushDeniedNote(
              pushPermission === "denied"
                ? "Browser denied notification permission. Enable it in your browser settings to receive reminders."
                : "Browser Push could not be enabled. Please try again.",
            );
          }
          return;
        }
      } else {
        await unsubscribeFromPush();
      }

      handleToggleField(channel.field, next);
      return;
    }

    handleToggleField(channel.field, next);
  };

  const handleTimeChange = (event) => {
    const next = event.target.value;
    setTimeDraft(next);
    dispatch(clearMutationError());
    if (timeDebounceRef.current) window.clearTimeout(timeDebounceRef.current);
    timeDebounceRef.current = window.setTimeout(() => {
      const apiTime = toApiTime(next);
      if (apiTime && apiTime !== data?.reminder_time) {
        dispatch(updateReminderSettings({ reminder_time: apiTime }));
      }
    }, TIME_DEBOUNCE_MS);
  };

  const handleSavePreferences = () => {
    if (!data) return;
    if (timeDebounceRef.current) {
      window.clearTimeout(timeDebounceRef.current);
      timeDebounceRef.current = null;
    }
    const dirty = {};
    const desiredTime = toApiTime(timeDraft);
    if (desiredTime && desiredTime !== data.reminder_time) dirty.reminder_time = desiredTime;
    if (Object.keys(dirty).length === 0) { dispatch(flashSaved()); return; }
    dispatch(updateReminderSettings(dirty));
  };

  const handleSnooze = (duration) => { dispatch(snoozeReminders(duration)); };
  const handleClearSnooze = () => { dispatch(clearSnooze()); };

  const handleTimezoneBlur = () => {
    const trimmed = tzDraft.trim();
    if (trimmed && trimmed !== data?.timezone) {
      dispatch(updateReminderSettings({ timezone: trimmed }));
    }
  };

  if (loading && !data) {
    return (
      <div style={{
        marginTop: 14, background: "rgba(0,0,0,0.2)",
        border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
        padding: "14px 16px", color: C.muted, fontSize: 11,
      }}>
        Loading reminder settings…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{
        marginTop: 14, background: "rgba(240,80,80,0.08)",
        border: "1px solid rgba(240,80,80,0.3)", borderRadius: 14,
        padding: "14px 16px", color: "#f87171", fontSize: 11,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <span>{error}</span>
        <button type="button" onClick={() => dispatch(fetchReminderSettings())} style={{
          background: "transparent", border: "1px solid rgba(240,80,80,0.3)",
          color: "#f87171", borderRadius: 8, padding: "4px 12px",
          fontSize: 10, cursor: "pointer", fontWeight: 600,
        }}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{
      marginTop: 14,
      background: themed.isDark ? "rgba(0,0,0,0.2)" : "rgba(15,23,42,0.04)",
      border: `1px solid ${data.is_enabled ? "rgba(107,179,63,0.3)" : themed.border}`,
      borderRadius: 14, padding: "14px 16px", color: themed.text,
    }}>
      {/* HEADER */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: expanded ? 18 : 0, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Reminder Settings</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{statusLine}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: data.is_enabled ? C.g3 : C.muted, fontWeight: 600 }}>
            {data.is_enabled ? "ON" : "OFF"}
          </span>
          <Toggle
            checked={Boolean(data.is_enabled)}
            onChange={(next) => handleToggleField("is_enabled", next)}
          />
        </div>
        <button type="button" onClick={() => setExpanded((c) => !c)} style={{
          background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
          color: C.muted, borderRadius: 8, padding: "4px 12px",
          cursor: "pointer", fontSize: 10, marginLeft: 4, fontWeight: 600,
        }}>
          {expanded ? "▲ Collapse" : "▼ Configure"}
        </button>
      </div>

      {expanded && (
        <div style={{
          opacity: data.is_enabled ? 1 : 0.38,
          pointerEvents: data.is_enabled ? "auto" : "none",
          transition: "opacity 0.2s",
        }}>
          {mutationError && (
            <Notice tone="error" onClose={() => dispatch(clearMutationError())}>
              {mutationError}
            </Notice>
          )}

          {/* DELIVERY CHANNEL */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: C.muted,
              textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
            }}>
              Delivery Channel
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {CHANNELS.map((channel) => {
                const enabled = Boolean(data[channel.field]);
                const isPush = channel.id === "push";
                const pushUnsupported = isPush && !pushSupported;
                const pushDesync = isPush && enabled && !pushSubscribed && !pushBusy;
                const cardDisabled = channel.disabled || (isPush && pushBusy);

                let note = channel.note;
                if (!note) {
                  if (isPush) {
                    if (pushUnsupported) {
                      note = isIOSDevice() && !isStandaloneMode()
                        ? "Add to Home Screen first"
                        : "Not supported in this browser";
                    } else if (pushBusy) {
                      note = enabled ? "Disabling…" : "Requesting…";
                    } else if (pushDesync) {
                      note = "Tap to re-enable";
                    } else if (enabled && pushSubscribed) {
                      note = "Enabled";
                    } else {
                      note = "Needs permission";
                    }
                  } else {
                    note = enabled ? "Enabled" : "Works immediately";
                  }
                }

                const borderColor = pushDesync ? "rgba(232,160,32,0.5)" : enabled ? C.g3 : "rgba(255,255,255,0.1)";
                const bg = pushDesync ? "rgba(232,160,32,0.08)" : enabled ? "rgba(107,179,63,0.12)" : "rgba(255,255,255,0.03)";
                const labelColor = pushDesync ? C.gold : enabled ? C.g3 : "#fff";

                return (
                  <button key={channel.id} type="button" disabled={cardDisabled}
                    onClick={() => handleChannelClick(channel)}
                    style={{
                      padding: "8px 14px", borderRadius: 10,
                      cursor: cardDisabled ? "not-allowed" : "pointer",
                      border: `1px solid ${borderColor}`, background: bg,
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 3, minWidth: 90,
                      opacity: channel.disabled || pushUnsupported ? 0.45 : 1,
                      transition: "all 0.15s",
                    }}>
                    <span style={{ fontSize: 18 }}>{channel.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: labelColor }}>{channel.label}</span>
                    <span style={{ fontSize: 8, color: C.muted }}>{note}</span>
                    {isPush && pushBusy && <span style={{ fontSize: 8, color: C.gold }}>Working…</span>}
                    {isPush && enabled && pushSubscribed && !pushBusy && (
                      <span style={{ fontSize: 8, color: C.g3 }}>✓ Enabled</span>
                    )}
                  </button>
                );
              })}
            </div>

            {pushDeniedNote && (
              <Notice tone="warn" onClose={() => setPushDeniedNote("")}>{pushDeniedNote}</Notice>
            )}

            {data.push_enabled && (
              <div style={{
                background: "rgba(107,179,63,0.06)", border: "1px solid rgba(107,179,63,0.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 12,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.g3, marginBottom: 6 }}>
                  📲 How Browser Push Works
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {PUSH_PLATFORM_NOTES.map(([platform, status]) => (
                    <div key={platform} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 8.5 }}>
                      <span style={{ minWidth: 160, color: "rgba(255,255,255,0.55)" }}>{platform}</span>
                      <span style={{ color: pushNoteColor(status) }}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIME + TIMEZONE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Reminder Time
                </div>
                <input type="time" value={timeDraft} onChange={handleTimeChange} style={{
                  width: "100%", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)", color: "#fff",
                  borderRadius: 8, padding: "7px 10px", fontSize: 13, fontWeight: 700,
                  outline: "none", cursor: "pointer", colorScheme: "dark", boxSizing: "border-box",
                }} />
                <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>
                  Daily challenge reminder fires at this time
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Timezone
                </div>
                <input type="text" value={tzDraft}
                  onChange={(e) => setTzDraft(e.target.value)}
                  onBlur={handleTimezoneBlur}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)",
                    borderRadius: 8, padding: "7px 10px", fontSize: 11,
                    outline: "none", boxSizing: "border-box",
                  }} />
                <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>Auto-detected from your browser</div>
              </div>
            </div>
          </div>

          {/* REMINDER TYPE TOGGLES */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Which Reminders to Receive
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {REMINDER_TYPES.map((type) => {
                const active = Boolean(data[type.key]);
                return (
                  <div key={type.key} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "8px 12px", background: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                    border: `1px solid ${active ? "rgba(107,179,63,0.2)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{type.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: active ? "#fff" : "rgba(255,255,255,0.4)" }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize: 8, color: C.muted, marginTop: 1 }}>{type.sub}</div>
                    </div>
                    <Toggle size="sm" checked={active} onChange={(next) => handleToggleField(type.key, next)} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* SNOOZE */}
          <div style={{
            marginBottom: 16, padding: "10px 14px",
            background: "rgba(255,255,255,0.025)", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>⏸ Snooze All Reminders</div>
                <div style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>
                  {isSnoozing ? `Snoozed until ${snoozeEnds}` : "Temporarily pause all notifications"}
                </div>
              </div>
              {isSnoozing && (
                <button type="button" onClick={handleClearSnooze} style={{
                  background: "rgba(240,80,80,0.15)", border: "1px solid rgba(240,80,80,0.3)",
                  color: "#f87171", borderRadius: 8, padding: "4px 10px",
                  cursor: "pointer", fontSize: 9, fontWeight: 600,
                }}>Cancel Snooze</button>
              )}
            </div>
            {!isSnoozing && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SNOOZE_OPTIONS.map((option) => (
                  <button key={option.id} type="button" onClick={() => handleSnooze(option.id)} style={{
                    padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: "rgba(255,255,255,0.55)",
                    cursor: "pointer", fontSize: 10, fontWeight: 600, transition: "all 0.15s",
                  }}>
                    {option.label}{" "}
                    <span style={{ fontSize: 8, color: C.muted, marginLeft: 2, fontWeight: 400 }}>{option.note}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SAVE */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <button type="button" onClick={handleSavePreferences} style={{
              padding: "9px 28px", borderRadius: 10, border: "none",
              cursor: "pointer", fontWeight: 700, fontSize: 12,
              background: saved ? C.g3 : `linear-gradient(135deg, ${C.g1}, ${C.g3})`,
              color: "#fff", transition: "all 0.2s",
            }}>
              {saved ? "✓ Saved!" : "Save Preferences"}
            </button>
            <div style={{ fontSize: 9, color: C.muted }}>
              Toggles save instantly · this button flushes any pending time change
            </div>
          </div>

          {/* HISTORY — Point 8: live data from GET /api/v1/reminder-settings/log */}
          <div>
            <button type="button" onClick={() => setHistoryOpen((c) => !c)} style={{
              background: "transparent", border: "none", color: C.muted,
              cursor: "pointer", fontSize: 9, fontWeight: 600,
              textDecoration: "underline", padding: 0, marginBottom: 8,
            }}>
              {historyOpen ? "▲ Hide reminder history" : "▼ Show last 7 reminders"}
            </button>

            {historyOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {logStatus === "loading" && (
                  <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>Loading recent sends…</div>
                )}
                {logStatus === "failed" && (
                  <div style={{ fontSize: 10, color: "#f87171", padding: "8px 0" }}>Could not load reminder history.</div>
                )}
                {logStatus !== "loading" && reminderLog.length === 0 && (
                  <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>No reminders sent yet.</div>
                )}
                {reminderLog.map((entry) => {
                  const statusColor = STATUS_COLOR[entry.status] || C.muted;
                  return (
                    <div key={entry.id} style={{
                      display: "grid", gridTemplateColumns: "28px 1fr 70px 60px",
                      alignItems: "center", gap: 8, padding: "6px 10px",
                      background: "rgba(255,255,255,0.02)", borderRadius: 8,
                    }}>
                      <span style={{ fontSize: 14, textAlign: "center" }}>
                        {TYPE_ICONS[entry.reminder_type] ?? "🔔"}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 9.5, color: "rgba(255,255,255,0.65)", fontWeight: 600,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {entry.reminder_type.replace(/_/g, " ")}
                        </div>
                        <div style={{ fontSize: 8, color: C.muted }}>
                          {new Date(entry.sent_at).toLocaleString(undefined, {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <span style={{ fontSize: 8, color: C.muted, textAlign: "center", textTransform: "lowercase" }}>
                        {entry.channel}
                      </span>
                      <span style={{
                        fontSize: 8, fontWeight: 700, textAlign: "center",
                        color: statusColor, background: `${statusColor}28`,
                        borderRadius: 4, padding: "1px 6px", whiteSpace: "nowrap",
                      }}>
                        {entry.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!data.is_enabled && (
            <div style={{ marginTop: 12 }}>
              <Notice tone="info">Toggle the master switch above to enable reminders.</Notice>
            </div>
          )}
        </div>
      )}
    </div>
  );
}