import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { C } from "../../../components/mobile/palette";
import { Bar, Pill } from "../../../components/mobile/primitives";
import { fetchUsers } from "../../../store/userSlice";
import { fetchCompanyById } from "../../../store/companySlice";
import { getCompanyId } from "../../../utils/roleHelper";

const DEPT_COLORS = [C.g3, C.blue, C.gold, C.orange, C.teal, C.purple];

export default function HrHome() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const { users, total, usersLoading } = useSelector((state) => state.user);
  const { selectedCompany } = useSelector((state) => state.company);
  const companyId = auth.user?.company_id || getCompanyId();

  useEffect(() => {
    if (companyId) {
      dispatch(fetchUsers({ companyId, limit: 500 }));
      dispatch(fetchCompanyById(companyId));
    }
  }, [dispatch, companyId]);

  const empCount = total || users?.length || 0;
  const companyName =
    selectedCompany?.company_name ||
    auth.user?.company_name ||
    "Company Workspace";

  // Aggregate department counts from the live user list; fall back to the
  // design's demo departments when the user list isn't tagged yet.
  const deptRows = useMemo(() => {
    const counts = (users || []).reduce((acc, u) => {
      const d = u.department || "Other";
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const fallback = [
      ["Engineering", 86],
      ["Product", 42],
      ["Finance", 38],
    ];
    return (top.length ? top : fallback).map(([name, n], i) => ({
      d: name,
      n,
      wi: [72, 69, 64][i] ?? 65,
      c: DEPT_COLORS[i] || C.g3,
    }));
  }, [users]);

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>
      <div style={{ padding: "10px 16px 10px" }}>
        <div style={{ fontSize: 8.5, color: C.muted }}>{companyName}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
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
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: s.c,
                lineHeight: 1,
              }}
            >
              {s.v}
            </div>
            <div style={{ fontSize: 7.5, color: C.muted, marginTop: 1 }}>
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
            <div style={{ fontSize: 8.5, color: C.muted }}>Last 8 weeks</div>
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
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 10,
          }}
        >
          Top Departments · WI
        </div>
        {deptRows.map((d) => (
          <div key={d.d} style={{ marginBottom: 9 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 3,
              }}
            >
              <span
                style={{ fontSize: 9.5, color: "rgba(255,255,255,.55)" }}
              >
                {d.d}{" "}
                <span style={{ fontSize: 8, color: C.muted }}>({d.n})</span>
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: d.c }}>
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
