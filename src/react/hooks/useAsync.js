import { useCallback, useEffect, useState } from "react";

// Runs `load` on mount (and whenever `deps` change) and returns
// { data, loading, reload }. reload() re-runs it while keeping the current
// data on screen, so refreshing after an action doesn't flash empty.
export function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true;
    load().then((data) => {
      if (current) setState({ data, loading: false });
    });
    return () => {
      current = false;
    };
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
