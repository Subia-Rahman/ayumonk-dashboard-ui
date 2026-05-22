import { useState } from "react";
import { C } from "../../../components/mobile/palette";
import { Pill } from "../../../components/mobile/primitives";

// Five interactive challenges from the design. Local state for now —
// dashboardSlice.postDashboardChallengeAction exists but the design's fixed
// challenge ids don't map onto the dynamic challenge_key list from the KPI
// feed, so persistence stays local until the API exposes a matching set.
export default function Challenges() {
  const [water, setWater] = useState(4);
  const [sleep, setSleep] = useState(false);
  const [breath, setBreath] = useState(false);
  const [moodDone, setMoodDone] = useState(false);

  const done =
    [water >= 8, sleep, breath, moodDone, false].filter(Boolean).length;
  const xp = done * 25 + water * 3;
  const dateLabel = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>
      <div
        style={{
          padding: "8px 16px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
            🎯 Challenges
          </div>
          <div style={{ fontSize: 8.5, color: C.muted }}>
            {dateLabel} · Tap to complete
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.gold }}>
            {xp} XP
          </div>
          <div style={{ fontSize: 7.5, color: C.muted }}>earned today</div>
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          margin: "0 12px 12px",
          background: C.card,
          borderRadius: 14,
          padding: "11px 14px",
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 5,
          }}
        >
          <span style={{ fontSize: 8.5, color: C.muted, fontWeight: 600 }}>
            TODAY
          </span>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: "#fff" }}>
            {done}/5 done
          </span>
        </div>
        <div
          style={{
            height: 5,
            background: "rgba(255,255,255,.05)",
            borderRadius: 3,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(done / 5) * 100}%`,
              background: `linear-gradient(90deg,${C.g2},${C.g3})`,
              borderRadius: 3,
              transition: "width .4s",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 5,
          }}
        >
          <span style={{ fontSize: 8, color: C.muted }}>🔥 7-day streak</span>
          <span style={{ fontSize: 8, color: C.g3 }}>
            Level 3 · 125 XP to Level 4
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "0 12px",
          display: "flex",
          flexDirection: "column",
          gap: 9,
        }}
      >
        {/* Hydration */}
        <div
          style={{
            background: C.card,
            borderRadius: 18,
            padding: "13px 14px",
            border: "1px solid #38bdf833",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#38bdf818",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                }}
              >
                💧
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  Hydration Mission
                </div>
                <div style={{ fontSize: 8.5, color: C.muted }}>
                  Hydration · 20 XP
                </div>
              </div>
            </div>
            <span
              style={{ fontSize: 14, fontWeight: 800, color: "#38bdf8" }}
            >
              {water}/8
            </span>
          </div>
          <div
            style={{
              height: 5,
              background: "rgba(255,255,255,.05)",
              borderRadius: 3,
              marginBottom: 9,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(water / 8) * 100}%`,
                background: "#38bdf8",
                borderRadius: 3,
                transition: "width .3s",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button
              type="button"
              onClick={() => setWater((v) => Math.max(0, v - 1))}
              style={{
                flex: 1,
                padding: 9,
                borderRadius: 10,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.07)",
                color: "rgba(255,255,255,.4)",
                fontSize: 16,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setWater((v) => Math.min(8, v + 1))}
              style={{
                flex: 2,
                padding: 9,
                borderRadius: 10,
                background: "rgba(56,189,248,.16)",
                border: "1px solid rgba(56,189,248,.35)",
                color: "#38bdf8",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ＋1 Glass 💧
            </button>
          </div>
          {water >= 8 && (
            <div
              style={{
                marginTop: 7,
                textAlign: "center",
                fontSize: 9.5,
                color: "#4ade80",
                fontWeight: 700,
              }}
            >
              ✓ Complete! +20 XP
            </div>
          )}
        </div>

        {/* Auto-tracked steps */}
        <div
          style={{
            background: C.card,
            borderRadius: 18,
            padding: "13px 14px",
            border: `1px solid ${C.orange}33`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 7,
            }}
          >
            <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: `${C.orange}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                }}
              >
                👟
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  8,000 Steps
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                  <Pill label="⚡ Auto-tracked" color={C.g3} />
                  <span
                    style={{
                      fontSize: 8,
                      color: C.muted,
                      alignSelf: "center",
                    }}
                  >
                    Google Health
                  </span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.orange }}>
                6,240
              </div>
              <div style={{ fontSize: 8, color: C.muted }}>/ 8,000</div>
            </div>
          </div>
          <div
            style={{
              height: 5,
              background: "rgba(255,255,255,.05)",
              borderRadius: 3,
            }}
          >
            <div
              style={{
                height: "100%",
                width: "78%",
                background: C.orange,
                borderRadius: 3,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 8,
              color: C.muted,
              marginTop: 5,
              textAlign: "center",
            }}
          >
            1,760 steps to go · auto-confirms at midnight
          </div>
        </div>

        {/* Breathing */}
        <div
          style={{
            background: C.card,
            borderRadius: 18,
            padding: "13px 14px",
            border: `1px solid ${C.orange}33`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: `${C.orange}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                }}
              >
                🫁
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  4-7-8 Breathing
                </div>
                <div style={{ fontSize: 8.5, color: C.muted }}>
                  Stress · 25 XP
                </div>
              </div>
            </div>
            {breath && <Pill label="✓ Done +25XP" color="#4ade80" />}
          </div>
          {!breath ? (
            <button
              type="button"
              onClick={() => setBreath(true)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 12,
                background: `${C.orange}18`,
                border: `1px solid ${C.orange}44`,
                color: C.orange,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ▶ Start 2-Min Session (🎤 Voice + Tone)
            </button>
          ) : (
            <div
              style={{
                textAlign: "center",
                fontSize: 9.5,
                color: "#4ade80",
                fontWeight: 700,
              }}
            >
              ✓ Session done! +25 XP earned
            </div>
          )}
        </div>

        {/* Sleep toggle */}
        <div
          style={{
            background: C.card,
            borderRadius: 18,
            padding: "13px 14px",
            border: "1px solid #7c6af733",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#7c6af718",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 19,
              }}
            >
              🌙
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                Sleep Before 10:30 PM
              </div>
              <div style={{ fontSize: 8.5, color: C.muted }}>Sleep · 30 XP</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSleep((p) => !p)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: sleep
                ? "rgba(74,222,128,.14)"
                : "rgba(255,255,255,.06)",
              color: sleep ? "#4ade80" : "rgba(255,255,255,.4)",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {sleep ? "✓ Done" : "Commit"}
          </button>
        </div>

        {/* Mood */}
        <div
          style={{
            background: C.card,
            borderRadius: 18,
            padding: "13px 14px",
            border: "1px solid #34d39933",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 9,
              alignItems: "center",
              marginBottom: 9,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#34d39918",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 19,
              }}
            >
              😊
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                Daily Mood Check
              </div>
              <div style={{ fontSize: 8.5, color: C.muted }}>
                Emotional · 10 XP
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["😞", "😕", "😐", "🙂", "😄"].map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setMoodDone(true)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.06)",
                  background: "rgba(255,255,255,.04)",
                  fontSize: 17,
                  cursor: "pointer",
                }}
              >
                {e}
              </button>
            ))}
          </div>
          {moodDone && (
            <div
              style={{
                textAlign: "center",
                fontSize: 9,
                color: "#4ade80",
                marginTop: 6,
                fontWeight: 700,
              }}
            >
              ✓ Logged! +10 XP
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
