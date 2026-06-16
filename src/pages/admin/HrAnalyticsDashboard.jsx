import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments } from "../../store/departmentSlice";
import { fetchLocations } from "../../store/locationSlice";
import {
  fetchHrEmployeeCount,
  fetchHrGenderWellness,
  fetchHrHeadcount,
  fetchHrHeatmapLocationDept,
  fetchHrSummaryCards,
  fetchHrWellnessByDimension,
  fetchHrWellnessDimensions,
  buildFilterParams,
} from "../../store/hrAnalyticsSlice";
import api from "../../services/api";
import { API_URLS } from "../../services/apiUrls";
import { getCompanyId } from "../../utils/roleHelper";
import Layout from "../../layouts/commonLayout/Layout";
import KpiScheduleCalendar from "../../components/KpiScheduleCalendar";

// Backend stores gender in title case and filters with an exact-match SQL
// predicate (cu.gender = :f_gender), so the dropdown values must match the
// DB casing or every row gets dropped.
const FORM_GENDERS = ["Male", "Female", "Other"];
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

// Scatter bubble palette — picked here so the scatter render below stays
// declarative. Department labels come from the API at runtime.
const SCATTER_COLORS = ["#4A90C4", "#22c55e", "#E8924A", "#3AADA8", "#f472b6", "#D4A843"];

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
    summary: hrSummary,
    summaryLoading: hrSummaryLoading,
    employeeCount: hrEmployeeCount,
    headcount: hrHeadcount,
  } = useSelector((state) => state.hrAnalytics);

  // Productivity payload kept locally for the scatter plot. The CXO card's
  // existing fetch only loads whichever metric is selected on the toggle, so
  // we mirror just `productivity` here so the scatter keeps working when the
  // CXO toggle is on engagement/absenteeism.
  const [scatterProductivity, setScatterProductivity] = useState(null);

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

  // Gender bar chart + heatmap + summary tiles + counts all share the same
  // filter set, so they refetch together. The wellnessindex dispatch keeps
  // the scatter's x-axis fresh even when the wellness toggle is on a
  // different dimension (its result lands in dataByDimension.wellnessindex).
  useEffect(() => {
    dispatch(fetchHrGenderWellness({ filters: hrFilters }));
    dispatch(fetchHrHeatmapLocationDept({ filters: hrFilters }));
    dispatch(fetchHrSummaryCards({ filters: hrFilters }));
    dispatch(fetchHrEmployeeCount({ filters: hrFilters }));
    dispatch(fetchHrHeadcount({ filters: hrFilters }));
    dispatch(
      fetchHrWellnessByDimension({
        dimension: "wellnessindex",
        filters: hrFilters,
      }),
    );
  }, [dispatch, hrFilters]);

  // Productivity for the scatter — separate from the CXO card's toggle fetch
  // so flipping the CXO tab doesn't blow away the scatter's y-axis.
  useEffect(() => {
    let cancelled = false;
    api
      .get(API_URLS.hrCxoMetrics, {
        params: { metric: "productivity", ...buildFilterParams(hrFilters) },
      })
      .then((response) => {
        if (cancelled) return;
        const payload = response?.data;
        if (payload?.success) setScatterProductivity(payload.data || null);
        else setScatterProductivity(null);
      })
      .catch(() => {
        if (!cancelled) setScatterProductivity(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hrFilters]);

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

  const heatmapLocations = hrHeatmap?.locations || [];
  const heatmapDepartments = hrHeatmap?.departments || [];

  const genderRows = useMemo(() => {
    // /hr/gender-wellness intentionally ignores the gender filter on the
    // backend (gender is the grouping axis), so when a user has narrowed
    // scope to one gender we trim the other rows client-side. Without this,
    // selecting Gender=Male would still render the Female/Other bars.
    const order = ["Male", "Female", "Other"];
    const selectedGender =
      fG && fG !== "All" ? String(fG).toLowerCase() : null;
    return order
      .filter((g) => !selectedGender || g.toLowerCase() === selectedGender)
      .map((g) => {
        const row = hrGender.find(
          (r) =>
            String(r.gender || "").toLowerCase() === g.toLowerCase(),
        );
        return row ? { ...row, gender: g } : null;
      })
      .filter(Boolean);
  }, [hrGender, fG]);

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

  // Department-level scatter points joined from three independent endpoints:
  //   x = wellnessindex   (fetchHrWellnessByDimension dispatched for the
  //                        scatter in the hrFilters effect above)
  //   y = productivity    (scatterProductivity local state, see effect above)
  //   r = headcount       (fetchHrHeadcount by_department)
  // Inner join on the lowercased label so departments missing from any one
  // endpoint are dropped rather than being plotted at 0.
  const scatterPoints = useMemo(() => {
    const wellnessDept =
      hrDataByDimension?.wellnessindex?.by_department || [];
    const productivityDept = scatterProductivity?.by_department || [];
    const headcountDept = hrHeadcount?.by_department || [];

    const productivityByLabel = new Map(
      productivityDept.map((r) => [String(r.label || "").toLowerCase(), r.value]),
    );
    const headcountByLabel = new Map(
      headcountDept.map((r) => [String(r.label || "").toLowerCase(), r.count]),
    );

    return wellnessDept
      .map((row) => {
        const key = String(row.label || "").toLowerCase();
        const wellness = row.value;
        const productivity = productivityByLabel.get(key);
        const count = headcountByLabel.get(key);
        if (
          wellness == null ||
          productivity == null ||
          count == null ||
          !row.label
        ) {
          return null;
        }
        return {
          label: row.label,
          wellness: Number(wellness),
          productivity: Number(productivity),
          count: Number(count),
        };
      })
      .filter(Boolean);
  }, [hrDataByDimension, scatterProductivity, hrHeadcount]);

  const locationOpts = useMemo(() => {
    const companyLocationId = companyMe?.location_id;
    if (!companyLocationId) return [];
    const match = locationItems.find(
      (l) => String(l.id) === String(companyLocationId),
    );
    return match ? [match.name] : [];
  }, [companyMe, locationItems]);

  // Render-time formatting for the six summary tiles. Each entry pairs a
  // backend key under hrSummary with its accent colour, icon, and a
  // value-formatter that handles null + unit suffixes. Labels and subtext
  // come straight from the API so any future copy change is backend-driven.
  const formatTileValue = (card, decimals = 1) => {
    if (!card || card.value == null) return "—";
    const fixed = Number(card.value).toFixed(decimals);
    if (!card.unit) return fixed;
    if (card.unit === "%") return `${fixed}%`;
    if (card.unit === "/100") return fixed;
    return `${fixed} ${card.unit}`;
  };
  const summaryCards = [
    {
      icon: "🌿",
      key: "avg_wellness",
      card: hrSummary?.avg_wellness,
      defaultLabel: "Avg Wellness",
      defaultSubtext: "/ 100",
      color: C.g3,
      value: formatTileValue(hrSummary?.avg_wellness, 1),
    },
    {
      icon: "🎯",
      key: "productivity",
      card: hrSummary?.productivity,
      defaultLabel: "Productivity",
      defaultSubtext: "self-reported",
      color: C.blue,
      value: formatTileValue(hrSummary?.productivity, 1),
    },
    {
      icon: "💬",
      key: "engagement",
      card: hrSummary?.engagement,
      defaultLabel: "Engagement",
      defaultSubtext: "Gallup Q12",
      color: C.purple,
      value: formatTileValue(hrSummary?.engagement, 1),
    },
    {
      icon: "📅",
      key: "absenteeism",
      card: hrSummary?.absenteeism,
      defaultLabel: "Absenteeism",
      defaultSubtext: "per month",
      color: C.red,
      value: formatTileValue(hrSummary?.absenteeism, 1),
    },
    {
      icon: "🌙",
      key: "sleep_score",
      card: hrSummary?.sleep_score,
      defaultLabel: "Sleep Score",
      defaultSubtext: "out of 5",
      color: C.purple,
      value: formatTileValue(hrSummary?.sleep_score, 1),
    },
    {
      icon: "🧘",
      key: "stress_score",
      card: hrSummary?.stress_score,
      defaultLabel: "Stress Score",
      defaultSubtext: "lower is better",
      color: C.orange,
      value: formatTileValue(hrSummary?.stress_score, 1),
    },
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
            {hrEmployeeCount?.filtered ?? "—"}
          </span>{" "}
          of{" "}
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
            {hrEmployeeCount?.total ?? companyMe?.no_of_employees ?? "—"}
          </span>{" "}
          employees in scope
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
        {summaryCards.map((tile) => {
          const label = tile.card?.label || tile.defaultLabel;
          const subtext = tile.card?.subtext || tile.defaultSubtext;
          return (
            <Card
              key={tile.key}
              color={tile.color + "33"}
              style={{ padding: "12px 14px" }}
            >
              <div style={{ fontSize: 20, marginBottom: 3 }}>{tile.icon}</div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>
                {label}
              </div>
              <div
                style={{ fontSize: 20, fontWeight: 800, color: tile.color }}
              >
                {hrSummaryLoading && tile.value === "—" ? "…" : tile.value}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
                {subtext}
              </div>
            </Card>
          );
        })}
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
          {scatterPoints.length === 0 ? (
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                padding: "30px 0",
                textAlign: "center",
              }}
            >
              No correlation data
            </div>
          ) : (
            <svg width="100%" height={130} viewBox="0 0 300 130">
              {scatterPoints.map((p, i) => {
                const x = 20 + (p.wellness / 100) * 260;
                const y = 120 - (p.productivity / 100) * 110;
                const color = SCATTER_COLORS[i % SCATTER_COLORS.length];
                return (
                  <g key={p.label}>
                    <circle
                      cx={x}
                      cy={y}
                      r={Math.sqrt(Math.max(p.count, 1)) * 1.6 + 4}
                      fill={color}
                      opacity="0.5"
                    />
                    <text
                      x={x}
                      y={y + 3.5}
                      textAnchor="middle"
                      fontSize="7"
                      fill="#fff"
                    >
                      {p.label.slice(0, 3)}
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
          )}
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

      <KpiScheduleCalendar companyId={resolvedCompanyId} />
      
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
