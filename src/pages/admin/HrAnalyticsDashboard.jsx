import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments } from "../../store/departmentSlice";
import { fetchLocations } from "../../store/locationSlice";
import api from "../../services/api";
import { API_URLS } from "../../services/apiUrls";
import { getCompanyId } from "../../utils/roleHelper";
import Layout from "../../layouts/commonLayout/Layout";

const FORM_GENDERS = ["male", "female", "other"];
const FORM_AGE_BANDS = ["20-25", "26-30", "31-35", "36-40", "41-50", "50+"];

const C = {
  bg: "#0b160c",
  card: "#111e12",
  border: "#1e3d20",
  g1: "#2C5F2D",
  g2: "#4A8C2A",
  g3: "#6DB33F",
  g4: "#97C95C",
  white: "#FFFFFF",
  cream: "#E8F0E0",
  muted: "#6B8F60",
  orange: "#E8924A",
  blue: "#4A90C4",
  purple: "#8B6FCB",
  gold: "#D4A843",
  teal: "#3AADA8",
  red: "#E05050",
  pink: "#f472b6",
};

const DEPTS = ["Engineering", "Marketing", "Finance", "HR", "Operations", "Product"];
const LOCATIONS = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Pune"];
const AGE_BANDS = ["20-25", "26-30", "31-35", "36-40", "41-50", "50+"];
const GENDERS = ["Male", "Female", "Other"];

function buildSeed(i) {
  let h = (i + 1) * 2654435761;
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return ((h >>> 0) % 100000) / 100000;
  };
}

const HR_ROWS = Array.from({ length: 240 }, (_, i) => {
  const r = buildSeed(i);
  return {
    dept: DEPTS[i % 6],
    loc: LOCATIONS[i % 5],
    age: AGE_BANDS[i % 6],
    gender: GENDERS[i % 3],
    wellnessIndex: +(58 + r() * 30).toFixed(1),
    productivity: +(60 + r() * 30).toFixed(1),
    engagement: +(55 + r() * 35).toFixed(1),
    absenteeism: +(2 + r() * 5).toFixed(1),
    sleep: +(2.8 + r() * 1.5).toFixed(2),
    stress: +(2.5 + r() * 2).toFixed(2),
    nutrition: +(3.0 + r() * 1.5).toFixed(2),
  };
});

function Card({ children, style = {}, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${color || "rgba(255,255,255,0.07)"}`,
        borderRadius: 14,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        ...style,
      }}
      onMouseEnter={
        onClick
          ? (e) => {
              e.currentTarget.style.borderColor = (color || "#6db33f") + "88";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          : undefined
      }
      onMouseLeave={
        onClick
          ? (e) => {
              e.currentTarget.style.borderColor =
                color || "rgba(255,255,255,0.07)";
              e.currentTarget.style.transform = "";
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function BarChart({ data, color = "#6db33f", h = 80 }) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: h }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 8, color, fontWeight: 700 }}>{d.v}</span>
          <div
            style={{
              width: "100%",
              borderRadius: "3px 3px 0 0",
              background: color,
              opacity: 0.75,
              height: `${Math.max(4, (d.v / max) * 62)}px`,
              transition: "height 0.5s",
            }}
          />
          <span
            style={{
              fontSize: 7,
              color: "rgba(255,255,255,0.3)",
              textAlign: "center",
            }}
          >
            {d.l.slice(0, 5)}
          </span>
        </div>
      ))}
    </div>
  );
}


function Sel({ label, value, onChange, opts }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label
        style={{
          fontSize: 8,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          padding: "5px 10px",
          borderRadius: 8,
          fontSize: 11,
          cursor: "pointer",
        }}
      >
        {/* Native <option> elements render in the OS dropdown chrome (white on
            most platforms), so they inherit the parent <select>'s color:#fff
            and become invisible. Pin each option to a dark bg + white text so
            the labels stay legible inside the popup. */}
        <option value="All" style={{ background: C.card, color: "#fff" }}>
          All
        </option>
        {opts.map((o) => (
          <option
            key={o}
            value={o}
            style={{ background: C.card, color: "#fff" }}
          >
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ options, value, onChange, colors }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 3,
        background: "rgba(0,0,0,0.3)",
        borderRadius: 8,
        padding: 3,
        flexWrap: "wrap",
      }}
    >
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "none",
            fontSize: 9,
            fontWeight: 600,
            cursor: "pointer",
            background:
              value === o ? (colors ? colors[i] : C.g3) : "transparent",
            color: value === o ? "#fff" : "rgba(255,255,255,0.4)",
            transition: "all 0.2s",
          }}
        >
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </button>
      ))}
    </div>
  );
}

function HRDashboardContent() {
  const dispatch = useDispatch();
  const [fD, setFD] = useState("All");
  const [fL, setFL] = useState("All");
  const [fA, setFA] = useState("All");
  const [fG, setFG] = useState("All");
  const [cxo, setCxo] = useState("productivity");
  const [well, setWell] = useState("wellnessIndex");
  const [companyMe, setCompanyMe] = useState(null);

  const { items: departmentItems } = useSelector((state) => state.department);
  const { items: locationItems } = useSelector((state) => state.location);

  // /companies/me is the authoritative source of the HR's company — the login
  // payload (and therefore localStorage / getCompanyId()) is empty for some
  // tenant users, so we resolve it lazily here and use it to drive both the
  // department fetch (scoped to that company) and the location filter (which
  // narrows the global location list to the company's own location).
  useEffect(() => {
    dispatch(fetchLocations({ isActive: true, limit: 500 }));

    let cancelled = false;
    api
      .get(API_URLS.companyMe)
      .then((response) => {
        const payload = response?.data;
        if (!cancelled && payload?.success) setCompanyMe(payload.data || null);
      })
      .catch(() => {
        // Non-fatal: location dropdown will simply have no options if the
        // company record can't be loaded.
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const resolvedCompanyId =
    companyMe?.id || companyMe?.company_id || getCompanyId() || "";

  useEffect(() => {
    if (!resolvedCompanyId) return;
    dispatch(
      fetchDepartments({ companyId: resolvedCompanyId, isActive: true }),
    );
  }, [dispatch, resolvedCompanyId]);

  const departmentOpts = useMemo(
    () => departmentItems.filter((d) => d.is_active).map((d) => d.name),
    [departmentItems],
  );

  const locationOpts = useMemo(() => {
    const companyLocationId = companyMe?.location_id;
    if (!companyLocationId) return [];
    const match = locationItems.find(
      (l) => String(l.id) === String(companyLocationId),
    );
    return match ? [match.name] : [];
  }, [companyMe, locationItems]);

  const filtered = useMemo(
    () =>
      HR_ROWS.filter(
        (r) =>
          (fD === "All" || r.dept === fD) &&
          (fL === "All" || r.loc === fL) &&
          (fA === "All" || r.age === fA) &&
          (fG === "All" || r.gender === fG),
      ),
    [fD, fL, fA, fG],
  );

  const avg = (m) =>
    +(
      filtered.reduce((s, r) => s + r[m], 0) / Math.max(filtered.length, 1)
    ).toFixed(1);

  const agg = (key, m) => {
    const mp = {};
    filtered.forEach((r) => {
      if (!mp[r[key]]) mp[r[key]] = [];
      mp[r[key]].push(r[m]);
    });
    return Object.entries(mp).map(([k, v]) => ({
      l: k,
      v: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1),
    }));
  };

  const summaryCards = [
    ["🌿", "Avg Wellness", avg("wellnessIndex"), "/ 100", C.g3],
    ["🎯", "Productivity", avg("productivity") + "%", "self-reported", C.blue],
    ["💬", "Engagement", avg("engagement") + "%", "Gallup Q12", C.purple],
    ["📅", "Absenteeism", avg("absenteeism") + " d", "per month", C.red],
    ["🌙", "Sleep Score", avg("sleep"), "out of 5", C.purple],
    ["🧘", "Stress Score", avg("stress"), "lower is better", C.orange],
  ];

  return (
    <div>
      {/* FILTERS */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          background: "rgba(255,255,255,0.02)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 18,
          alignItems: "flex-end",
        }}
      >
        <Sel label="Department" value={fD} onChange={setFD} opts={departmentOpts} />
        <Sel label="Location" value={fL} onChange={setFL} opts={locationOpts} />
        <Sel label="Age Band" value={fA} onChange={setFA} opts={FORM_AGE_BANDS} />
        <Sel label="Gender" value={fG} onChange={setFG} opts={FORM_GENDERS} />
        <div style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>
          <span style={{ color: C.g3, fontWeight: 700, fontSize: 16 }}>
            {filtered.length}
          </span>{" "}
          employees selected
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(148px,1fr))",
          gap: 10,
          marginBottom: 18,
        }}
      >
        {summaryCards.map(([icon, lbl, val, sub, col]) => (
          <Card key={lbl} color={col + "33"} style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 20, marginBottom: 3 }}>{icon}</div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>
              {lbl}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: col }}>
              {val}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
              {sub}
            </div>
          </Card>
        ))}
      </div>

      {/* CHART ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              Wellness by Dimension
            </div>
            <Toggle
              options={["wellnessIndex", "sleep", "stress", "nutrition"]}
              value={well}
              onChange={setWell}
              colors={[C.g3, C.purple, C.orange, "#22c55e"]}
            />
          </div>
          <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>
            By Department
          </div>
          <BarChart data={agg("dept", well)} color={C.g3} h={75} />
          <div
            style={{
              fontSize: 9,
              color: C.muted,
              marginTop: 12,
              marginBottom: 6,
            }}
          >
            By Location
          </div>
          <BarChart data={agg("loc", well)} color={C.teal} h={75} />
        </Card>
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              CXO Performance Metrics
            </div>
            <Toggle
              options={["productivity", "engagement", "absenteeism"]}
              value={cxo}
              onChange={setCxo}
              colors={[C.blue, C.orange, C.red]}
            />
          </div>
          <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>
            By Department
          </div>
          <BarChart data={agg("dept", cxo)} color={C.blue} h={75} />
          <div
            style={{
              fontSize: 9,
              color: C.muted,
              marginTop: 12,
              marginBottom: 6,
            }}
          >
            By Age Band
          </div>
          <BarChart data={agg("age", cxo)} color={C.purple} h={75} />
        </Card>
      </div>

      {/* GENDER BREAKDOWN + SCATTER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            Gender-wise Wellness & Productivity
          </div>
          {["Male", "Female", "Other"].map((g, i) => {
            const rows = filtered.filter((r) => r.gender === g);
            if (!rows.length) return null;
            const wi = +(
              rows.reduce((s, r) => s + r.wellnessIndex, 0) / rows.length
            ).toFixed(1);
            const pr = +(
              rows.reduce((s, r) => s + r.productivity, 0) / rows.length
            ).toFixed(1);
            const cols = ["#38bdf8", "#f472b6", "#a3e635"];
            return (
              <div key={g} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: cols[i], fontWeight: 600 }}
                  >
                    {g}
                  </span>
                  <span style={{ fontSize: 10, color: C.muted }}>
                    Wellness:{" "}
                    <b style={{ color: cols[i] }}>{wi}</b> | Productivity:{" "}
                    <b style={{ color: cols[i] }}>{pr}%</b>
                  </span>
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 5,
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${wi}%`,
                      borderRadius: 5,
                      background: `linear-gradient(90deg,${cols[i]},${cols[i]}88)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            Wellness ↔ Productivity Correlation
          </div>
          <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>
            Each bubble = dept avg · size = headcount
          </div>
          <svg width="100%" height={130} viewBox="0 0 300 130">
            {DEPTS.map((d, i) => {
              const rows = filtered.filter((r) => r.dept === d);
              if (!rows.length) return null;
              const wi =
                rows.reduce((s, r) => s + r.wellnessIndex, 0) / rows.length;
              const pr =
                rows.reduce((s, r) => s + r.productivity, 0) / rows.length;
              const cols = [C.blue, "#22c55e", C.orange, C.teal, C.pink, C.gold];
              const x = 20 + (wi / 100) * 260;
              const y = 120 - (pr / 100) * 110;
              return (
                <g key={d}>
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.sqrt(rows.length) * 1.6 + 4}
                    fill={cols[i]}
                    opacity="0.5"
                  />
                  <text
                    x={x}
                    y={y + 3.5}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#fff"
                  >
                    {d.slice(0, 3)}
                  </text>
                </g>
              );
            })}
            <line
              x1="20"
              y1="120"
              x2="280"
              y2="120"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <line
              x1="20"
              y1="10"
              x2="20"
              y2="120"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text
              x="150"
              y="129"
              textAnchor="middle"
              fontSize="7.5"
              fill={C.muted}
            >
              Wellness Index →
            </text>
          </svg>
        </Card>
      </div>

      {/* HEATMAP */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
          📊 Location × Department Wellness Heatmap
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 400,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "8px 12px",
                    fontSize: 9,
                    color: C.muted,
                    textAlign: "left",
                  }}
                >
                  ↓ Location / Dept →
                </th>
                {DEPTS.map((d) => (
                  <th
                    key={d}
                    style={{
                      padding: "8px 8px",
                      fontSize: 9,
                      color: C.muted,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {d.slice(0, 6)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOCATIONS.map((loc) => (
                <tr key={loc}>
                  <td
                    style={{
                      padding: "6px 12px",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.5)",
                      fontWeight: 600,
                    }}
                  >
                    {loc}
                  </td>
                  {DEPTS.map((dept) => {
                    const rows = HR_ROWS.filter(
                      (r) => r.loc === loc && r.dept === dept,
                    );
                    const wi = rows.length
                      ? +(
                          rows.reduce((s, r) => s + r.wellnessIndex, 0) /
                          rows.length
                        ).toFixed(0)
                      : null;
                    if (!wi) {
                      return (
                        <td key={dept} style={{ padding: "4px 8px" }}>
                          <div
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: 6,
                              padding: "3px 0",
                              textAlign: "center",
                              fontSize: 9,
                              color: "rgba(255,255,255,0.15)",
                            }}
                          >
                            —
                          </div>
                        </td>
                      );
                    }
                    const inten = Math.max(0, (wi - 50) / 40);
                    return (
                      <td
                        key={dept}
                        style={{ padding: "4px 8px", textAlign: "center" }}
                      >
                        <div
                          style={{
                            background: `rgba(107,179,63,${
                              inten * 0.65 + 0.1
                            })`,
                            borderRadius: 6,
                            padding: "3px 0",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {wi}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function HrAnalyticsDashboard() {
  return (
    <Layout role="admin" title="HR Analytics">
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.28)",
          marginBottom: 14,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          paddingBottom: 10,
        }}
      >
        👔 HR Intelligence Centre — Population Health Analytics · CXO Metrics
        · Location & Department Insights
      </div>

      <HRDashboardContent />
    </Layout>
  );
}
