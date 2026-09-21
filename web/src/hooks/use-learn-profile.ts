"use client";

import { useCallback, useEffect, useState } from "react";
import {
  completeTask,
  computeStreak,
  getTasks,
  hasProfile,
  loadProfile,
  loadSnapshot,
  resetDailyTasksIfNeeded,
  saveProfile,
  tasksProgress,
  type LearnProfile,
  type LearnSnapshot,
  type LearnTaskId,
  type LearnTaskState,
} from "@/lib/learn-store";

export function useLearnProfile() {
  const [snapshot, setSnapshot] = useState<LearnSnapshot>(() => loadSnapshot());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    resetDailyTasksIfNeeded();
    setSnapshot(loadSnapshot());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener("abc-learn-change", onChange);
    return () => window.removeEventListener("abc-learn-change", onChange);
  }, [refresh]);

  const updateProfile = useCallback((profile: Omit<LearnProfile, "onboardedAt">) => {
    saveProfile(profile);
    refresh();
  }, [refresh]);

  const markTaskDone = useCallback((id: LearnTaskId, minutes?: number) => {
    completeTask(id, minutes);
    refresh();
  }, [refresh]);

  return {
    ready,
    snapshot,
    profile: snapshot.profile,
    tasks: snapshot.tasks as LearnTaskState[],
    hasProfile: hasProfile(),
    streak: computeStreak(),
    progress: tasksProgress(),
    refresh,
    updateProfile,
    markTaskDone,
    getProfile: loadProfile,
    getTasks,
  };
}
