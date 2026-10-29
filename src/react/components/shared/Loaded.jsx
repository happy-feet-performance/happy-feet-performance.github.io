import { useAsync } from "../../hooks/useAsync.js";

// Runs `load`, renders nothing until it resolves (like the old
// fetch-then-render dashboards), then calls children(data, reload).
export default function Loaded({ load, deps = [], children }) {
  const { data, loading, reload } = useAsync(load, deps);
  if (loading) return null;
  return children(data, reload);
}
