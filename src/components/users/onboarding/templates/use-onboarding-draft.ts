"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

type UseOnboardingDraftOptions<T> = {
  storageKey: string;
  initialValue: T;
  merge?: (base: T, draft: T) => T;
};

type DraftUpdater<T> = T | ((previous: T) => T);

const DRAFT_EVENT_NAME = "fitbalance:onboarding-draft-change";
const draftSnapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function parseDraft<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function resolveValue<T>(updater: DraftUpdater<T>, previous: T): T {
  return typeof updater === "function" ? (updater as (value: T) => T)(previous) : updater;
}

export function useOnboardingDraft<T>({
  storageKey,
  initialValue,
  merge,
}: UseOnboardingDraftOptions<T>) {
  const cacheKey = useMemo(
    () => `${storageKey}:${JSON.stringify(initialValue)}`,
    [initialValue, storageKey]
  );

  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === storageKey) {
        onStoreChange();
      }
    };

    const handleDraftChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (!customEvent.detail?.key || customEvent.detail.key === storageKey) {
        onStoreChange();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(DRAFT_EVENT_NAME, handleDraftChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(DRAFT_EVENT_NAME, handleDraftChange as EventListener);
    };
  }, [storageKey]);

  const getSnapshot = useCallback(() => {
    const raw = window.localStorage.getItem(storageKey);
    const cachedSnapshot = draftSnapshotCache.get(cacheKey);

    if (cachedSnapshot && cachedSnapshot.raw === raw) {
      return cachedSnapshot.value as T;
    }

    const stored = parseDraft<T>(raw);
    const nextValue = stored ? (merge ? merge(initialValue, stored) : stored) : initialValue;

    draftSnapshotCache.set(cacheKey, {
      raw,
      value: nextValue,
    });

    return nextValue;
  }, [cacheKey, initialValue, merge, storageKey]);

  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback((updater: DraftUpdater<T>) => {
    const nextValue = resolveValue(updater, getSnapshot());
    const nextRaw = JSON.stringify(nextValue);
    const previousRaw = window.localStorage.getItem(storageKey);

    if (previousRaw === nextRaw) {
      return;
    }

    draftSnapshotCache.set(cacheKey, {
      raw: nextRaw,
      value: nextValue,
    });
    window.localStorage.setItem(storageKey, nextRaw);
    window.dispatchEvent(
      new CustomEvent(DRAFT_EVENT_NAME, {
        detail: { key: storageKey },
      })
    );
  }, [cacheKey, getSnapshot, storageKey]);

  const clearDraft = useCallback(() => {
    draftSnapshotCache.delete(cacheKey);
    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(
      new CustomEvent(DRAFT_EVENT_NAME, {
        detail: { key: storageKey },
      })
    );
  }, [cacheKey, storageKey]);

  return { value, setValue, clearDraft };
}
