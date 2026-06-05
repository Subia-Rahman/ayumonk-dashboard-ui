import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments } from "../../store/departmentSlice";
import { fetchLocations } from "../../store/locationSlice";
import {
  fetchHrGenderWellness,
  fetchHrHeatmapLocationDept,
  fetchHrWellnessByDimension,
  fetchHrWellnessDimensions,
  buildFilterParams,
} from "../../store/hrAnalyticsSlice";
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
  // `options` may be a list of strings ("productivity") OR a list of
  // {key, label} objects (the shape returned by /hr/cxo-metrics/definitions).
  // Normalize once so the render code below doesn't have to branch.
  const normalized = options.map((o) =>
    typeof o === "string"
      ? { key: o, label: o.charAt(0).toUpperCase() + o.slice(1) }
      : { key: o.key, label: o.label || o.key },
  );
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
      {normalized.map((o, i) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "none",
            fontSize: 9,
            fontWeight: 600,
            cursor: "pointer",
            background:
              value === o.key ? (colors ? colors[i] : C.g3) : "transparent",
            color: value === o.key ? "#fff" : "rgba(255,255,255,0.4)",
            transition: "all 0.2s",
          }}
        >
          {o.label}
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
  // `well` starts empty and is resolved to the first key returned by
  // /hr/wellness-dimensions ("wellnessindex"). The toggle keys are the
  // dimension_keys on the backend.
  const [well, setWell] = useState("");
  const [companyMe, setCompanyMe] = useState(null);

  // CXO metric tabs (API 2) and the per-metric chart payload (API 1).
  // Tabs come from /hr/cxo-metrics/definitions and only include metrics that
  // have at least one active KPI mapping for the caller's company, so the UI
  // never offers a tab that would 404. Chart data is refetched on tab change.
  const [cxoDefinitions, setCxoDefinitions] = useState([]);
  const [cxoData, setCxoData] = useState(null);
  const [cxoLoading, setCxoLoading] = useState(false);
  const [cxoError, setCxoError] = useState("");

  const { items: departmentItems } = useSelector((state) => state.department);
  const { items: locationItems } = useSelector((state) => state.location);

  // HR Analytics chart data — three endpoints feeding the "Wellness by
  // Dimension" toggle/bars and the "Gender-wise Wellness & Productivity"
  // horizontal bars. company_id rides the JWT; no params here.
  const {
    dimensions: hrDimensions,
    dimensionsLoading: hrDimensionsLoading,
    dataByDimension: hrDataByDimension,
    dimensionDataLoading: hrDimensionDataLoading,
    dimensionDataError: hrDimensionDataError,
    gender: hrGender,
    genderLoading: hrGenderLoading,
    genderError: hrGenderError,
    heatmap: hrHeatmap,
    heatmapLoading: hrHeatmapLoading,
    heatmapError: hrHeatmapError,
  } = useSelector((state) => state.hrAnalytics);

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

  // Snapshot of the four top-level dropdowns in the shape the slice's
  // buildFilterParams expects. Memoized so dependent effects only refire
  // when the user actually changes a filter.
  const hrFilters = useMemo(
    () => ({
      department: fD === "All" ? "" : fD,
      location: fL === "All" ? "" : fL,
      ageBand: fA === "All" ? "" : fA,
      gender: fG === "All" ? "" : fG,
    }),
    [fD, fL, fA, fG],
  );

  // Dimension toggle list is filter-independent (it's just the metadata for
  // the tabs). Fetched once per mount.
  useEffect(() => {
    dispatch(fetchHrWellnessDimensions());
  }, [dispatch]);

  // Gender bar chart + heatmap refetch whenever any top-level filter changes.
  useEffect(() => {
    dispatch(fetchHrGenderWellness({ filters: hrFilters }));
    dispatch(fetchHrHeatmapLocationDept({ filters: hrFilters }));
  }, [dispatch, hrFilters]);

  // Default `well` to the first dimension returned by the API
  // (typically "wellnessindex"). Computed-then-set so the initial render's
  // by-dimension fetch has a key to send.
  useEffect(() => {
    if (!well && hrDimensions.length > 0) {
      setWell(hrDimensions[0].key);
    }
  }, [well, hrDimensions]);

  // Refetch the bar-chart payload whenever the toggle OR filters change.
  useEffect(() => {
    if (!well) return;
    dispatch(
      fetchHrWellnessByDimension({ dimension: well, filters: hrFilters }),
    );
  }, [dispatch, well, hrFilters]);

  const wellByDimension = hrDataByDimension?.[well] || null;
  const wellByDeptRows = useMemo(
    () =>
      (wellByDimension?.by_department || []).map((row) => ({
        l: row.label,
        v: Number(row.value) || 0,
      })),
    [wellByDimension],
  );
  const wellByLocRows = useMemo(
    () =>
      (wellByDimension?.by_location || []).map((row) => ({
        l: row.label,
        v: Number(row.value) || 0,
      })),
    [wellByDimension],
  );

  // Flatten the heatmap cells into a Map<"loc|dept", value> for O(1) lookup
  // in the table render below. Trim/lowercase the keys so a backend that
  // returns "Engineering" still matches a column labelled "Engineering ".
  const heatmapValueByCell = useMemo(() => {
    const map = new Map();
    (hrHeatmap?.cells || []).forEach((c) => {
      if (!c.location || !c.department) return;
      const key = `${String(c.location).trim().toLowerCase()}|${String(c.department).trim().toLowerCase()}`;
      map.set(key, c.value);
    });
    return map;
  }, [hrHeatmap]);

  const heatmapLocations =
    hrHeatmap?.locations && hrHeatmap.locations.length > 0
      ? hrHeatmap.locations
      : LOCATIONS;
  const heatmapDepartments =
    hrHeatmap?.departments && hrHeatmap.departments.length > 0
      ? hrHeatmap.departments
      : DEPTS;

  const genderRows = useMemo(() => {
    // Backend already returns Male / Female / Other in that order and skips
    // genders without data. Just normalize the case so the legend labels are
    // stable regardless of how the backend casts them.
    const order = ["Male", "Female", "Other"];
    return order
      .map((g) => {
        const row = hrGender.find(
          (r) =>
            String(r.gender || "").toLowerCase() === g.toLowerCase(),
        );
        return row ? { ...row, gender: g } : null;
      })
      .filter(Boolean);
  }, [hrGender]);

  // Load the tab list once. HR is a company-tier caller so the backend
  // forces the tenant from the JWT — we don't need to pass company_id.
  useEffect(() => {
    let cancelled = false;
    api
      .get(API_URLS.hrCxoMetricsDefinitions)
      .then((response) => {
        if (cancelled) return;
        const payload = response?.data;
        if (!payload?.success) return;
        const defs = Array.isArray(payload.data) ? payload.data : [];
        setCxoDefinitions(defs);
        // If our default tab isn't actually configured for this company,
        // snap to whatever the first available one is so the metric fetch
        // below doesn't immediately 404.
        if (defs.length && !defs.some((d) => d.key === cxo)) {
          setCxo(defs[0].key);
        }
      })
      .catch(() => {
        // Non-fatal — chart area falls back to its empty state.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch chart data whenever the selected metric tab changes.
  useEffect(() => {
    if (!cxo) return;
    let cancelled = false;
    setCxoLoading(true);
    api
      .get(API_URLS.hrCxoMetrics, { params: { metric: cxo, ...buildFilterParams(hrFilters) } })
      .then((response) => {
        if (cancelled) return;
        const payload = response?.data;
        if (payload?.success) {
          setCxoData(payload.data || null);
          setCxoError("");
        } else {
          setCxoData(null);
          setCxoError(payload?.message || "Failed to load metric.");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setCxoData(null);
        // 404 = no active mapping for this metric on this company. Surface
        // the backend's "CXO metric not configured" message verbatim.
        setCxoError(
          error?.response?.data?.message ||
          (error?.response?.status === 404
            ? "CXO metric not configured."
            : "Failed to load metric."),
        );
      })
      .finally(() => {
        if (!cancelled) setCxoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cxo, hrFilters]);

  const cxoByDept = useMemo(
    () =>
      (cxoData?.by_department || []).map((r) => ({
        l: r.label,
        v: Number(r.value) || 0,
      })),
    [cxoData],
  );
  const cxoByAge = useMemo(
    () =>
      (cxoData?.by_age_band || []).map((r) => ({
        l: r.label,
        v: Number(r.value) || 0,
      })),
    [cxoData],
  );

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
            {companyMe?.no_of_employees ?? "—"}
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
              options={hrDimensions}
              value={well}
              onChange={setWell}
              colors={[C.g3, C.purple, C.orange, "#22c55e", C.blue, C.gold]}
            />
          </div>
          {hrDimensionsLoading && hrDimensions.length === 0 ? (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              Loading…
            </div>
          ) : hrDimensionDataError ? (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              {hrDimensionDataError}
            </div>
          ) : hrDimensionDataLoading && !wellByDimension ? (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              Loading…
            </div>
          ) : (
            <>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>
                By Department
              </div>
              {wellByDeptRows.length ? (
                <BarChart data={wellByDeptRows} color={C.g3} h={75} />
              ) : (
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  No department data
                </div>
              )}
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
              {wellByLocRows.length ? (
                <BarChart data={wellByLocRows} color={C.teal} h={75} />
              ) : (
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  No location data
                </div>
              )}
            </>
          )}
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
              options={cxoDefinitions}
              value={cxo}
              onChange={setCxo}
              colors={[C.blue, C.orange, C.red, C.purple, C.gold, C.teal]}
            />
          </div>
          {cxoLoading && !cxoData ? (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              Loading…
            </div>
          ) : cxoError ? (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              {cxoError}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>
                By Department
              </div>
              {cxoByDept.length ? (
                <BarChart data={cxoByDept} color={C.blue} h={75} />
              ) : (
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  No department data
                </div>
              )}
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
              {cxoByAge.length ? (
                <BarChart data={cxoByAge} color={C.purple} h={75} />
              ) : (
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  No age-band data
                </div>
              )}
            </>
          )}
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
          {hrGenderLoading && genderRows.length === 0 ? (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              Loading…
            </div>
          ) : hrGenderError ? (
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              {hrGenderError}
            </div>
          ) : genderRows.length === 0 ? (
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              No gender data
            </div>
          ) : (
            genderRows.map((row, i) => {
              const cols = ["#38bdf8", "#f472b6", "#a3e635"];
              const wi =
                row.wellness_score == null
                  ? null
                  : Number(row.wellness_score);
              const pr =
                row.productivity_score == null
                  ? null
                  : Number(row.productivity_score);
              return (
                <div key={row.gender} style={{ marginBottom: 14 }}>
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
                      {row.gender}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted }}>
                      Wellness:{" "}
                      <b style={{ color: cols[i] }}>
                        {wi == null ? "—" : wi}
                      </b>{" "}
                      | Productivity:{" "}
                      <b style={{ color: cols[i] }}>
                        {pr == null ? "—" : `${pr}%`}
                      </b>
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
                        width: `${wi == null ? 0 : Math.max(0, Math.min(100, wi))}%`,
                        borderRadius: 5,
                        background: `linear-gradient(90deg,${cols[i]},${cols[i]}88)`,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
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
        {hrHeatmapLoading && heatmapValueByCell.size === 0 ? (
          <div
            style={{
              fontSize: 10,
              color: C.muted,
              padding: "30px 0",
              textAlign: "center",
            }}
          >
            Loading…
          </div>
        ) : hrHeatmapError ? (
          <div
            style={{
              fontSize: 10,
              color: C.muted,
              padding: "30px 0",
              textAlign: "center",
            }}
          >
            {hrHeatmapError}
          </div>
        ) : heatmapLocations.length === 0 || heatmapDepartments.length === 0 ? (
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.3)",
              padding: "30px 0",
              textAlign: "center",
            }}
          >
            No heatmap data
          </div>
        ) : (
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
                  {heatmapDepartments.map((d) => (
                    <th
                      key={d}
                      style={{
                        padding: "8px 8px",
                        fontSize: 9,
                        color: C.muted,
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                      title={d}
                    >
                      {d.slice(0, 6)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapLocations.map((loc) => (
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
                    {heatmapDepartments.map((dept) => {
                      const cellKey = `${String(loc).trim().toLowerCase()}|${String(dept).trim().toLowerCase()}`;
                      const raw = heatmapValueByCell.get(cellKey);
                      const wi =
                        raw == null || Number.isNaN(Number(raw))
                          ? null
                          : Math.round(Number(raw));
                      if (wi == null) {
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
                      // Map score 50..90 → opacity 0.1..0.75 so high scores
                      // visually pop and missing rows stay nearly invisible.
                      const inten = Math.max(0, (wi - 50) / 40);
                      return (
                        <td
                          key={dept}
                          style={{
                            padding: "4px 8px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              background: `rgba(107,179,63,${inten * 0.65 + 0.1
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
        )}
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
