"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type RouteTransitionContextValue = {
  pendingPathname: string | null;
  startRouteTransition: (pathname: string) => void;
};

const RouteTransitionContext = createContext<RouteTransitionContextValue>({
  pendingPathname: null,
  startRouteTransition: () => undefined,
});

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingPathname, setPendingPathname] = useState<string | null>(null);

  useEffect(() => {
    setPendingPathname(null);
  }, [pathname]);

  const startRouteTransition = useCallback((nextPathname: string) => {
    setPendingPathname(nextPathname);
  }, []);

  const value = useMemo(
    () => ({ pendingPathname, startRouteTransition }),
    [pendingPathname, startRouteTransition],
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  return useContext(RouteTransitionContext);
}
