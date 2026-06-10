"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

const LS_KEY = "ai-news:hidden-sources";

/**
 * Manages the set of toggled-off sources.
 * - Logged-out users: persisted to localStorage.
 * - Logged-in users: persisted to the DB via /api/preferences.
 */
export function useHiddenSources() {
  const { user, loading } = useAuth();
  const [hidden, setHidden] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const userKey = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    // Only reload when the auth identity actually changes.
    if (userKey.current === (user?.id ?? null)) return;
    userKey.current = user?.id ?? null;

    let cancelled = false;
    async function load() {
      if (user) {
        try {
          const res = await fetch("/api/preferences", { cache: "no-store" });
          const data = await res.json();
          if (!cancelled) setHidden(Array.isArray(data.hiddenSources) ? data.hiddenSources : []);
        } catch {
          if (!cancelled) setHidden([]);
        }
      } else {
        try {
          const raw = localStorage.getItem(LS_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          if (!cancelled) setHidden(Array.isArray(parsed) ? parsed : []);
        } catch {
          if (!cancelled) setHidden([]);
        }
      }
      if (!cancelled) setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const persist = useCallback(
    (next: string[]) => {
      setHidden(next);
      if (user) {
        fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hiddenSources: next }),
        }).catch(() => {});
      } else {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota errors */
        }
      }
    },
    [user],
  );

  const toggle = useCallback(
    (name: string) => {
      persist(hidden.includes(name) ? hidden.filter((n) => n !== name) : [...hidden, name]);
    },
    [hidden, persist],
  );

  return { hidden, loaded, toggle, setHidden: persist };
}
