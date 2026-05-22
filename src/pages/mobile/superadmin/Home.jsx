import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { fetchCompanies } from "../../../store/companySlice";

const QUICK_ACTIONS = [
  {
    i: "🏢",
    l: "Add Company",
    c: C.blue,
    path: "/super-admin/company-data/add",
  },
  {
    i: "👤",
    l: "Add User",
    c: C.g3,
    path: "/super-admin/company-users/add",
  },
  { i: "🎯", l: "New KPI", c: C.gold, path: "/super-admin/kpis/add" },
  {
    i: "❓",
    l: "Add Question",
    c: C.orange,
    path: "/super-admin/questions/add",
  },
  {
    i: "🌿",
    l: "Suggestions",
    c: C.teal,
    path: "/super-admin/suggestion-master",
  },
  {
    i: "🏆",
    l: "Challenges",
    c: C.purple,
    path: "/super-admin/challenges",
  },
];

export default function SaHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companies, companiesLoading } = useSelector((state) => state.company);

  useEffect(() => {
    dispatch(fetchCompanies({}));
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = companies?.length || 0;
    const totalUsers = (companies || []).reduce(
      (sum, c) => sum + (Number(c.no_of_employees) || 0),
      0,
    );
    const userLabel =
      totalUsers >= 1000
        ? `${(totalUsers / 1000).toFixed(1)}K`
        : String(totalUsers);
    return {
      companies: total,
      users: userLabel,
    };
  }, [companies]);

  const recent = (companies || []).slice(0, 3);

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>
      <div style={{ padding: "10px 16px 10px" }}>
        <div style={{ fontSize: 8.5, color: C.muted }}>Platform overview</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
          System Dashboard
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 9,
          margin: "0 12px 12px",
        }}
      >
        {[
          {
            l: "Companies",
            v:
              companiesLoading && !stats.companies ? "…" : stats.companies,
            i: "🏢",
            c: C.blue,
            d: "",
          },
          { l: "Total Users", v: stats.users, i: "👥", c: C.g3, d: "" },
          {
            l: "Active KPIs",
            v: "284",
            i: "🎯",
            c: C.gold,
            d: "across all cos",
          },
          {
            l: "Platform WI",
            v: "71.2",
            i: "📈",
            c: C.teal,
            d: "▲ 2.1% MoM",
          },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: C.card,
              borderRadius: 16,
              padding: 13,
              border: `1px solid ${s.c}22`,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 3 }}>{s.i}</div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: s.c,
                lineHeight: 1,
              }}
            >
              {s.v}
            </div>
            <div style={{ fontSize: 8.5, color: C.muted, marginTop: 1 }}>
              {s.l}
            </div>
            {s.d && (
              <div
                style={{
                  fontSize: 7.5,
                  color: "rgba(255,255,255,.25)",
                  marginTop: 3,
                }}
              >
                {s.d}
              </div>
            )}
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
            fontSize: 10.5,
            fontWeight: 700,
            color: "rgba(255,255,255,.55)",
            marginBottom: 10,
          }}
        >
          Quick Actions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.l}
              type="button"
              onClick={() => navigate(a.path)}
              style={{
                padding: 9,
                borderRadius: 12,
                background: `${a.c}0e`,
                border: `1px solid ${a.c}28`,
                color: a.c,
                fontSize: 9.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 15 }}>{a.i}</span>
              {a.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ margin: "0 12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 9,
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: "rgba(255,255,255,.42)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Recent Companies
          </span>
          <span
            onClick={() => navigate("/super-admin/company-data")}
            style={{ fontSize: 8.5, color: C.g3, cursor: "pointer" }}
          >
            View all →
          </span>
        </div>
        {companiesLoading && !recent.length && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading companies…
          </div>
        )}
        {!companiesLoading && recent.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No companies yet.
          </div>
        )}
        {recent.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/super-admin/company-data/${c.id}`)}
            style={{
              background: C.card,
              borderRadius: 14,
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `${C.g3}16`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              🏢
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.company_name}
              </div>
              <div style={{ fontSize: 8, color: C.muted }}>
                {c.no_of_employees || 0} users
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.g3 }}>
                {65 + ((parseInt(c.id, 10) || 0) % 15)}
              </div>
              <div style={{ fontSize: 7.5, color: C.muted }}>Avg WI</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
