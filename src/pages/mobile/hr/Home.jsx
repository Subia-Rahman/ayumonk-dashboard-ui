import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { C } from "../../../components/mobile/palette";
import { Logo, Bar, Pill } from "../../../components/mobile/primitives";
import { fetchUsers } from "../../../store/userSlice";
import { getCompanyId } from "../../../utils/roleHelper";

export default function HrHome() {
  const dispatch = useDispatch();
  const { users, total, usersLoading } = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    const companyId = auth.user?.company_id || getCompanyId();
    if (companyId) {
      dispatch(fetchUsers({ companyId, limit: 500 }));
    }
  }, [dispatch, auth.user?.company_id]);

  const empCount = total || users?.length || 0;

  // Department aggregation from the live user list — falls back to design
  // demo set when no users have departments populated yet.
  const deptCounts = (users || []).reduce((acc, u) => {
    const d = u.department || "Other";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const topDepts = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const fallbackDepts = [
    ["Engineering", 86],
    ["Product", 42],
    ["Finance", 38],
  ];
  const deptRows = (topDepts.length ? topDepts : fallbackDepts).map(
    ([name, n], i) => ({
      d: name,
      n,
      wi: [72, 69, 64][i] ?? 65,
      c: [C.g3, C.blue, C.gold][i] ?? C.g3,
    }),
  );

  return (
    <div>
      <div
        style={{
          padding: "12px 16px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo s={22} />
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                background: "linear-gradient(90deg,#4a7c2f,#6db33f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AYUMONK
            </div>
            <div
              style={{
                fontSize: 7.5,
                color: C.blue,
                fontWeight: 700,
                letterSpacing: 0.8,
              }}
            >
              HR PORTAL
            </div>
          </div>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(135deg,${C.blue}88,${C.blue})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          HR
        </div>
      </div>
      <div style={{ padding: "2px 16px 10px" }}>
        <div style={{ fontSize: 9, color: C.muted }}>
          {auth.user?.email || "Company workspace"}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
          Company Dashboard
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          margin: "0 12px 12px",
        }}
      >
        {[
          { l: "Employees", v: usersLoading ? "…" : empCount, i: "👥", c: C.blue },
          { l: "Avg WI", v: "68.4", i: "📊", c: C.g3 },
          { l: "Active KPIs", v: "6", i: "🎯", c: C.gold },
          { l: "Forms Due", v: "48", i: "📝", c: C.orange },
          { l: "Completion", v: "92%", i: "✅", c: "#4ade80" },
          { l: "Absenteeism", v: "2.3%", i: "📉", c: C.teal },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: C.card,
              borderRadius: 14,
              padding: "10px 8px",
              border: `1px solid ${s.c}22`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 17, marginBottom: 2 }}>{s.i}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.c, lineHeight: 1 }}>
              {s.v}
            </div>
            <div style={{ fontSize: 8, color: C.muted, marginTop: 1 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          margin: "0 12px 12px",
          background: C.card,
          borderRadius: 18,
          padding: 13,
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
              Company Wellness Trend
            </div>
            <div style={{ fontSize: 9, color: C.muted }}>Last 8 weeks</div>
          </div>
          <Pill label="▲ 6.2%" color="#4ade80" />
        </div>
        <Bar
          data={[
            { l: "W5", v: 60 },
            { l: "W6", v: 63 },
            { l: "W7", v: 61 },
            { l: "W8", v: 65 },
            { l: "W9", v: 64 },
            { l: "W10", v: 67 },
            { l: "W11", v: 66 },
            { l: "W12", v: 68 },
          ]}
          color={C.g3}
          h={55}
        />
      </div>

      <div
        style={{
          margin: "0 12px",
          background: C.card,
          borderRadius: 18,
          padding: 13,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
          Top Departments · WI
        </div>
        {deptRows.map((d) => (
          <div key={d.d} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.55)" }}>
                {d.d}{" "}
                <span style={{ fontSize: 8, color: C.muted }}>({d.n})</span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: d.c }}>
                {d.wi}
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: "rgba(255,255,255,.04)",
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${d.wi}%`,
                  background: d.c,
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
