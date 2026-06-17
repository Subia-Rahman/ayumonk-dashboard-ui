import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Stack, Typography, Chip, Button, CircularProgress,
} from '@mui/material';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

const T = {
  bg: '#0b160c',
  panel: '#0f1a10',
  tile: '#131f14',
  border: 'rgba(255,255,255,0.07)',
  borderSoft: 'rgba(255,255,255,0.06)',
  text: '#e9f1e7',
  textHi: '#eaf2e8',
  textMid: '#cfe0c9',
  textLow: '#7e9a78',
  textFaint: '#5f7e58',
  track: '#1a2a1b',
  green: '#6DB33F',
  amber: '#D4A843',
  red: '#e5704b',
  superAdmin: '#f97316',
  roles: { employee: '#6B8F6D', hr: '#4A90C4', companyAdmin: '#8B6FCB', cxo: '#D4A843', ayumonkAdmin: '#6DB33F' },
};

const STATUS_COLOR = { healthy: T.green, watch: T.amber, risk: T.red };
const DONUT_COLORS = [T.green, T.roles.hr, T.amber, T.roles.companyAdmin, '#5BA6A0', '#C77FA3'];

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';
const TENANT_HEALTH_PATH = '/config/api/v1/tenant-health';

const MOCK_ROWS = [
  { id: 1, company_name: 'TechCorp Pvt Ltd',  industry: 'IT',     registered_employees: 320, active_employees: 210, onboarding_pct: 78, last_activity: '2026-06-15', days_since_activity: 2  },
  { id: 2, company_name: 'RetailCo Ltd',       industry: 'Retail', registered_employees: 850, active_employees: 540, onboarding_pct: 62, last_activity: '2026-06-16', days_since_activity: 1  },
  { id: 3, company_name: 'PharmaCorp',         industry: 'Pharma', registered_employees: 210, active_employees:  80, onboarding_pct: 41, last_activity: '2026-05-20', days_since_activity: 28 },
  { id: 4, company_name: 'StartupXYZ',         industry: 'Tech',   registered_employees:   0, active_employees:   0, onboarding_pct:  0, last_activity: null,         days_since_activity: null},
];

function getAuthToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    ''
  );
}

async function fetchTenantHealth() {
  const res = await fetch(`${API_BASE}${TENANT_HEALTH_PATH}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Not authorized — sign in as a platform admin to view tenant health.');
  }
  // 404 = endpoint not deployed yet; fall back to mock preview data
  if (res.status === 404) return { rows: MOCK_ROWS, preview: true };
  if (!res.ok) throw new Error(`Could not load tenant health (HTTP ${res.status}).`);
  const json = await res.json();
  return { rows: Array.isArray(json && json.data) ? json.data : [], preview: false };
}

function deriveStatus(r) {
  const registered = Number(r.registered_employees) || 0;
  if (registered === 0 || r.last_activity == null) return 'risk';
  const days = r.days_since_activity;
  const stale = days != null && days > 21;
  const lowOnboarding = (Number(r.onboarding_pct) || 0) < 50;
  if (stale || lowOnboarding) return 'watch';
  return 'healthy';
}

function attentionReason(r) {
  if ((Number(r.registered_employees) || 0) === 0) return 'no employees enrolled';
  if (r.last_activity == null) return 'no activity yet';
  if (r.days_since_activity != null && r.days_since_activity > 21) {
    return `${r.days_since_activity} days since activity`;
  }
  if ((Number(r.onboarding_pct) || 0) < 50) {
    return `onboarding at ${Math.round(Number(r.onboarding_pct) || 0)}%`;
  }
  return 'needs attention';
}

const sumBy = (arr, key) => arr.reduce((acc, x) => acc + (Number(x[key]) || 0), 0);

function KpiTile({ label, value, sub, subColor }) {
  return (
    <Box sx={{ bgcolor: T.tile, border: `1px solid ${T.borderSoft}`, borderRadius: 2.5, px: 1.4, py: 1.25 }}>
      <Typography sx={{ fontSize: 11, color: T.textLow, letterSpacing: '0.03em' }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, lineHeight: 1.05, mt: 0.5, color: T.textHi }}>{value}</Typography>
      {sub != null && (
        <Typography sx={{ fontSize: 11, mt: 0.25, color: subColor || T.green }}>{sub}</Typography>
      )}
    </Box>
  );
}

function Panel({ title, right, children, sx }) {
  return (
    <Box sx={{ bgcolor: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 2.75, p: 1.5, ...sx }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.1 }}>
        <Typography sx={{ fontSize: 12.5, color: T.textMid }}>{title}</Typography>
        {right}
      </Stack>
      {children}
    </Box>
  );
}

function ComingSoon({ title, note }) {
  return (
    <Box
      sx={{
        bgcolor: T.panel, border: `1px dashed ${T.borderSoft}`, borderRadius: 2.75, p: 1.5,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 132,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography sx={{ fontSize: 12.5, color: T.textLow }}>{title}</Typography>
        <Chip
          label="coming soon"
          size="small"
          sx={{ height: 18, fontSize: 9.5, color: T.textFaint, bgcolor: 'transparent', border: `1px solid ${T.borderSoft}` }}
        />
      </Stack>
      <Typography sx={{ fontSize: 10.5, color: T.textFaint, lineHeight: 1.5 }}>{note}</Typography>
    </Box>
  );
}

function StatusDot({ status, size = 8 }) {
  return (
    <Box component="span" sx={{ width: size, height: size, borderRadius: '50%', bgcolor: STATUS_COLOR[status], display: 'inline-block' }} />
  );
}

function IndustryDonut({ rows }) {
  const entries = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      const k = (r.industry && String(r.industry).trim()) || 'Unspecified';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], i) => ({ label, count, color: DONUT_COLORS[i % DONUT_COLORS.length] }));
  }, [rows]);

  const total = rows.length || 1;
  const R = 28;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <svg width="74" height="74" viewBox="0 0 74 74" aria-hidden="true">
        <circle cx="37" cy="37" r={R} fill="none" stroke={T.track} strokeWidth="9" />
        {entries.map((e) => {
          const len = (e.count / total) * circumference;
          const circle = (
            <circle
              key={e.label}
              cx="37" cy="37" r={R} fill="none" stroke={e.color} strokeWidth="9"
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 37 37)"
            />
          );
          offset += len;
          return circle;
        })}
      </svg>
      <Box sx={{ fontSize: 10, color: T.textMid, lineHeight: 1.7 }}>
        {entries.map((e) => (
          <Box key={e.label}>
            <Box component="span" sx={{ color: e.color }}>●</Box>{' '}
            {e.label} <Box component="span" sx={{ color: T.textLow }}>· {e.count}</Box>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

function AttentionStrip({ rows }) {
  const flagged = rows
    .map((r) => ({ r, status: deriveStatus(r) }))
    .filter((x) => x.status !== 'healthy');

  if (flagged.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.1, flexWrap: 'wrap',
        bgcolor: 'rgba(229,112,75,0.08)', border: '1px solid rgba(229,112,75,0.22)',
        borderRadius: 2.5, px: 1.4, py: 1, mb: 1.6,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.6} sx={{ color: '#e8a08a' }}>
        <WarningAmberRoundedIcon sx={{ fontSize: 15 }} />
        <Typography sx={{ fontSize: 10.5 }}>Needs attention</Typography>
      </Stack>
      {flagged.map((x, i) => (
        <Stack key={x.r.id || i} direction="row" alignItems="center" spacing={1}>
          {i > 0 && <Box component="span" sx={{ color: '#3a4a3a' }}>·</Box>}
          <Typography sx={{ fontSize: 10, color: T.textMid }}>
            {x.r.company_name || 'Unnamed'} — {attentionReason(x.r)}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

function TenantHealthTable({ rows }) {
  const cols = '1.7fr 0.8fr 0.7fr 1.1fr 1fr 0.55fr';
  const headSx = { fontSize: 10, color: T.textLow, py: 0.75 };
  const cellSx = { fontSize: 10.5, color: T.textMid, py: 0.9, display: 'flex', alignItems: 'center' };

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: cols, columnGap: 1 }}>
        <Box sx={{ ...headSx }}>Company</Box>
        <Box sx={{ ...headSx, justifySelf: 'center' }}>Registered</Box>
        <Box sx={{ ...headSx, justifySelf: 'center' }}>Active</Box>
        <Box sx={{ ...headSx }}>Onboarding</Box>
        <Box sx={{ ...headSx }}>Last activity</Box>
        <Box sx={{ ...headSx, justifySelf: 'center' }}>Status</Box>
      </Box>

      {rows.map((r) => {
        const status = deriveStatus(r);
        const pct = Math.round(Number(r.onboarding_pct) || 0);
        const hasActivity = r.last_activity != null;
        return (
          <Box
            key={r.id || r.company_name}
            sx={{ display: 'grid', gridTemplateColumns: cols, columnGap: 1, borderTop: `1px solid ${T.borderSoft}` }}
          >
            <Box sx={{ ...cellSx, color: T.textMid }}>{r.company_name || 'Unnamed'}</Box>
            <Box sx={{ ...cellSx, justifyContent: 'center' }}>{Number(r.registered_employees) || 0}</Box>
            <Box sx={{ ...cellSx, justifyContent: 'center' }}>{Number(r.active_employees) || 0}</Box>
            <Box sx={{ ...cellSx }}>
              <Stack direction="row" alignItems="center" spacing={0.8} sx={{ width: '100%' }}>
                <Box sx={{ height: 4, width: 44, bgcolor: T.track, borderRadius: 1, flexShrink: 0 }}>
                  <Box sx={{ height: 4, width: `${Math.min(pct, 100)}%`, bgcolor: T.green, borderRadius: 1 }} />
                </Box>
                <Typography sx={{ fontSize: 10.5, color: pct === 0 ? T.textFaint : '#9bb89b' }}>{pct}%</Typography>
              </Stack>
            </Box>
            <Box sx={{ ...cellSx, color: hasActivity ? T.textLow : T.textFaint }}>
              {hasActivity ? `${r.days_since_activity}d ago` : 'no activity'}
            </Box>
            <Box sx={{ ...cellSx, justifyContent: 'center' }}>
              <StatusDot status={status} />
            </Box>
          </Box>
        );
      })}

      {rows.length === 0 && (
        <Box sx={{ py: 3, textAlign: 'center', color: T.textFaint, fontSize: 11, borderTop: `1px solid ${T.borderSoft}` }}>
          No companies to show.
        </Box>
      )}
    </Box>
  );
}

const QUICK_ACTIONS = [
  { label: 'Add company',      icon: <AddRoundedIcon sx={{ fontSize: 15 }} />,           route: '/super-admin/company-data' },
  { label: 'New KPI',          icon: <TrackChangesRoundedIcon sx={{ fontSize: 15 }} />,  route: '/super-admin/kpis' },
  { label: 'New challenge',    icon: <FlagRoundedIcon sx={{ fontSize: 15 }} />,           route: '/super-admin/challenges' },
  { label: 'Schedule session', icon: <EventRoundedIcon sx={{ fontSize: 15 }} />,          route: '/super-admin/sessions' },
];

export default function TenantHealthBoard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTenantHealth();
      setRows(result.rows);
      setPreview(result.preview);
    } catch (e) {
      setError((e && e.message) || 'Failed to load tenant health.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const companies = rows.length;
    const employees = sumBy(rows, 'registered_employees');
    const active = sumBy(rows, 'active_employees');
    const avgOnboarding = companies
      ? Math.round(rows.reduce((a, r) => a + (Number(r.onboarding_pct) || 0), 0) / companies)
      : 0;
    const needsAttention = rows.filter((r) => deriveStatus(r) !== 'healthy').length;
    return { companies, employees, active, avgOnboarding, needsAttention };
  }, [rows]);

  return (
    <Box
      sx={{
        bgcolor: T.bg, color: T.text, borderRadius: 3.5, p: 2,
        border: `1px solid ${T.border}`,
        fontFamily: 'inherit',
        mb: 2,
      }}
    >
      {/* header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.1}>
          <SpaceDashboardRoundedIcon sx={{ color: T.green, fontSize: 20 }} />
          <Box>
            <Typography sx={{ fontSize: 14.5, color: T.textHi }}>Platform overview</Typography>
            <Typography sx={{ fontSize: 10.5, color: T.textLow }}>
              {preview ? 'Preview mode · endpoint not yet deployed' : 'All companies · live'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {preview && (
            <Chip
              label="preview data"
              size="small"
              sx={{ height: 20, fontSize: 9.5, color: T.amber, bgcolor: 'rgba(212,168,67,0.12)', border: `1px solid rgba(212,168,67,0.25)` }}
            />
          )}
          <Chip
            label="Super admin · full access"
            size="small"
            sx={{ height: 22, fontSize: 10, color: '#f9a063', bgcolor: 'rgba(249,115,22,0.16)' }}
          />
          <Button
            onClick={load}
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{ color: T.textMid, textTransform: 'none', fontSize: 11, minWidth: 0 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* quick actions */}
      <Stack direction="row" spacing={0.9} sx={{ mb: 1.6, flexWrap: 'wrap', rowGap: 0.9 }}>
        {QUICK_ACTIONS.map((a) => (
          <Button
            key={a.label}
            startIcon={a.icon}
            onClick={() => navigate(a.route)}
            sx={{
              textTransform: 'none', fontSize: 10.5, color: T.textMid,
              bgcolor: T.tile, border: `1px solid ${T.border}`, borderRadius: 2,
              px: 1.2, py: 0.6,
              '&:hover': { bgcolor: '#16241640', borderColor: 'rgba(255,255,255,0.12)' },
            }}
          >
            {a.label}
          </Button>
        ))}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: T.green }} />
        </Box>
      ) : error ? (
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            bgcolor: 'rgba(229,112,75,0.08)', border: '1px solid rgba(229,112,75,0.22)',
            borderRadius: 2, px: 1.5, py: 1.1,
          }}
        >
          <Typography sx={{ fontSize: 11, color: '#f0b6a4' }}>{error}</Typography>
          <Button color="inherit" size="small" onClick={load} sx={{ fontSize: 10.5, color: '#f0b6a4', textTransform: 'none' }}>
            Retry
          </Button>
        </Box>
      ) : (
        <>
          {/* KPI strip */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(5,1fr)' },
              gap: 1, mb: 1.5,
            }}
          >
            <KpiTile label="Companies" value={stats.companies} sub="live tenants" subColor={T.textLow} />
            <KpiTile label="Employees" value={stats.employees} sub="registered" subColor={T.textLow} />
            <KpiTile label="Active" value={stats.active} sub="engaged" subColor={T.green} />
            <KpiTile label="Avg onboarding" value={`${stats.avgOnboarding}%`} sub="across tenants" subColor={T.textLow} />
            <KpiTile
              label="Needs attention"
              value={stats.needsAttention}
              sub={stats.needsAttention ? 'review below' : 'all healthy'}
              subColor={stats.needsAttention ? T.red : T.green}
            />
          </Box>

          <AttentionStrip rows={rows} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' },
              gap: 1.25, mb: 1.6,
            }}
          >
            <Panel title="Companies by industry">
              <IndustryDonut rows={rows} />
            </Panel>
            <ComingSoon title="Growth trends · 6 mo" note="Needs historical snapshots — a nightly job to record platform totals over time." />
            <ComingSoon title="Configuration evolution" note="Needs a stored launch baseline + an audit-log table to show change over time." />
          </Box>

          <Panel
            title={
              <Stack direction="row" alignItems="center" spacing={0.7}>
                <Box component="span" sx={{ color: T.green, fontSize: 12.5 }}>Tenant health</Box>
                <Typography sx={{ fontSize: 10.5, color: T.textLow }}>
                  · {rows.length} companies · {preview ? 'preview' : 'live'}
                </Typography>
              </Stack>
            }
            right={
              <Stack direction="row" spacing={1.4} sx={{ fontSize: 10.5, color: T.textLow }}>
                <Stack direction="row" alignItems="center" spacing={0.5}><StatusDot status="healthy" size={7} /><span>healthy</span></Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}><StatusDot status="watch" size={7} /><span>watch</span></Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}><StatusDot status="risk" size={7} /><span>at risk</span></Stack>
              </Stack>
            }
          >
            <TenantHealthTable rows={rows} />
          </Panel>
        </>
      )}
    </Box>
  );
}
