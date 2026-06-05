import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";
import Layout from "../../layouts/commonLayout/Layout";
import useTenantContext from "../../hooks/useTenantContext";
import { fetchRbacMatrix } from "../../store/rbacMatrixSlice";
import { fetchCompanies } from "../../store/companySlice";
import { ACCENT, useClientPalette } from "../../utils/clientPalette";

const ROLE_LABELS = { employee: "Employee", hr: "HR Manager", cxo: "CXO", admin: "Company Admin", ayumonk_admin: "Ayumonk Admin", super_admin: "Super Admin", superadmin: "Super Admin" };
const ROLE_COLORS = { employee: "#6B8F6D", hr: "#4A90C4", cxo: "#D4A843", admin: "#8B6FCB", ayumonk_admin: "#6DB33F", super_admin: "#f97316", superadmin: "#f97316" };

export default function Dashboard() {
  const dispatch = useDispatch();
  const stateRole = useSelector((state) => state.auth.role);
  const isPlatformAdmin = useSelector((state) => state.auth.isPlatformAdmin);
  const effectiveRole = stateRole || "superadmin";
  const C = useClientPalette();
  const { companyIdForRequest } = useTenantContext();
  const {
    data: rbacData,
    loading: rbacLoading,
    error: rbacError,
  } = useSelector((state) => state.rbacMatrix);
  const { companies, companiesLoading } = useSelector((state) => state.company);

  const [rbacCompanyFilter, setRbacCompanyFilter] = useState("");

  const canFilterByCompany =
    isPlatformAdmin ||
    effectiveRole === "superadmin" ||
    effectiveRole === "super_admin" ||
    effectiveRole === "ayumonk_admin";

  useEffect(() => {
    if (canFilterByCompany) {
      dispatch(fetchCompanies());
    }
  }, [dispatch, canFilterByCompany]);

  const effectiveRbacCompanyId = canFilterByCompany
    ? (rbacCompanyFilter || "").trim() || companyIdForRequest || ""
    : "";

  useEffect(() => {
    dispatch(fetchRbacMatrix({ companyId: effectiveRbacCompanyId }));
  }, [dispatch, effectiveRbacCompanyId]);

  const adminBadgeLabel = isPlatformAdmin
    ? "SUPER ADMIN"
    : effectiveRole === "super_admin" || effectiveRole === "superadmin"
      ? "SUPER ADMIN"
      : "ADMIN";
  const myRoleLabel = ROLE_LABELS[effectiveRole] || effectiveRole.toUpperCase();
  const myRoleColor = ROLE_COLORS[effectiveRole] || C.g3;

  return (
    <Layout role="superadmin" title="Admin Panel">
      <Box
        sx={{
          bgcolor: C.bg,
          color: C.text,
          borderRadius: 3,
          p: { xs: 1.5, md: 2 },
          fontFamily: "inherit",
          colorScheme: C.isDark ? "dark" : "light",
        }}
      >
        {/* Subtitle strip */}
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.32)",
            marginBottom: 14,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            paddingBottom: 10,
          }}
        >
          ⚙️ Admin Panel — Manage companies, users, themes, questions, challenges, suggestions and KPI sessions
        </div>

        {/* ADMIN HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 18 }}>⚙️</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>Admin Panel</span>
              <span
                style={{
                  fontSize: 8,
                  background: "rgba(240,80,80,0.12)",
                  color: "#f87171",
                  borderRadius: 5,
                  padding: "2px 8px",
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                {adminBadgeLabel}
              </span>
            </div>
            <div style={{ fontSize: 9, color: C.muted }}>
              Manage all platform entities — companies, users, content, and program configuration.
            </div>
          </div>
          <div
            style={{
              fontSize: 8,
              background: "rgba(107,179,63,0.08)",
              border: "1px solid rgba(107,179,63,0.2)",
              borderRadius: 8,
              padding: "6px 12px",
              color: C.g3,
              whiteSpace: "nowrap",
            }}
          >
            Logged in as {myRoleLabel} · Full access
          </div>
        </div>

        {/* RBAC COMPANY FILTER */}
        {canFilterByCompany && (
          <div
            style={{
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Filter access matrix by company
            </span>
            <select
              value={rbacCompanyFilter}
              onChange={(e) => setRbacCompanyFilter(e.target.value)}
              disabled={companiesLoading}
              style={{
                background: "rgba(30,50,30,0.9)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                outline: "none",
                minWidth: 240,
                cursor: companiesLoading ? "wait" : "pointer",
              }}
            >
              <option value="">
                {companyIdForRequest
                  ? "Use globally-selected tenant"
                  : "All companies (platform default)"}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
            {rbacCompanyFilter && (
              <button
                type="button"
                onClick={() => setRbacCompanyFilter("")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: C.muted,
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
            {companiesLoading && (
              <span style={{ fontSize: 9, color: C.muted }}>Loading companies…</span>
            )}
          </div>
        )}

        {/* RBAC MATRIX */}
        <div
          style={{
            marginBottom: 16,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
              🔐 Role-Based Access Control Matrix
              {rbacData.company_name && (
                <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6 }}>
                  · {rbacData.company_name}
                </span>
              )}
              {rbacLoading && (
                <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6 }}>
                  · loading…
                </span>
              )}
            </span>
            <span style={{ fontSize: 8, color: C.muted }}>
              Your role:{" "}
              <span style={{ color: myRoleColor, fontWeight: 700 }}>
                {myRoleLabel}
              </span>
            </span>
          </div>
          {rbacError && (
            <div
              style={{
                padding: "6px 14px",
                fontSize: 9,
                color: "#f87171",
                background: "rgba(240,80,80,0.06)",
                borderBottom: "1px solid rgba(240,80,80,0.18)",
              }}
            >
              {rbacError} — showing the default platform matrix below.
            </div>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  <th
                    style={{
                      padding: "6px 10px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Section
                  </th>
                  {rbacData.roles.map((role) => (
                    <th
                      key={role.key}
                      style={{
                        padding: "6px 10px",
                        textAlign: "center",
                        color: C.muted,
                        fontWeight: 600,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rbacData.sections.map((sectionRow, ri) => (
                  <tr
                    key={sectionRow.key}
                    style={{
                      background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <td
                      style={{
                        padding: "5px 10px",
                        color: "rgba(255,255,255,0.65)",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sectionRow.label}
                    </td>
                    {rbacData.roles.map((role) => {
                      const p = sectionRow.permissions?.[role.key] || "none";
                      const col = p === "full" ? C.g3 : p === "view" ? C.blue : "rgba(255,255,255,0.1)";
                      const bg =
                        p === "full"
                          ? "rgba(107,179,63,0.1)"
                          : p === "view"
                            ? "rgba(74,144,196,0.08)"
                            : "transparent";
                      return (
                        <td
                          key={role.key}
                          style={{
                            padding: "5px 10px",
                            textAlign: "center",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 7.5,
                              fontWeight: 700,
                              color: col,
                              background: bg,
                              borderRadius: 4,
                              padding: "1px 7px",
                            }}
                          >
                            {p === "none" ? "—" : p === "full" ? "✓ Full" : "👁 View"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Box>
    </Layout>
  );
}