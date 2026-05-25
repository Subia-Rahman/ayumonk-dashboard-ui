import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardChallenges from "../../user/DashboardChallenges";
import { fetchDashboardKpis } from "../../../store/dashboardSlice";

const METRIC_COLOR_SET = [
  "#7c3aed",
  "#ea580c",
  "#0f766e",
  "#0284c7",
  "#ca8a04",
  "#c026d3",
  "#16a34a",
  "#d946ef",
  "#2563eb",
];

const CHALLENGE_TYPE_COLORS = {
  counter: "#f97316",
  toggle: "#ec4899",
  choice: "#2563eb",
  multi: "#eab308",
  timer: "#8b5cf6",
  rating: "#14b8a6",
};

const getChallengeColor = (challengeType, index) =>
  CHALLENGE_TYPE_COLORS[String(challengeType || "").toLowerCase()] ||
  METRIC_COLOR_SET[index % METRIC_COLOR_SET.length];

export default function Challenges() {
  const dispatch = useDispatch();
  const {
    items: dashboardItems,
    loading,
    error,
  } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardKpis());
  }, [dispatch]);

  const challengeItems = useMemo(
    () =>
      dashboardItems.flatMap((item) =>
        (Array.isArray(item.challenges) ? item.challenges : []).map(
          (challenge, challengeIndex) => ({
            ...challenge,
            kpi_name: item.kpi_name,
            displayColor: getChallengeColor(
              challenge.challenge_type,
              challengeIndex,
            ),
          }),
        ),
      ),
    [dashboardItems],
  );

  return (
    <DashboardChallenges
      challenges={challengeItems}
      loading={loading}
      error={error}
    />
  );
}
