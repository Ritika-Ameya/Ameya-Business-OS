import { useEffect, useState } from "react";
import type { ActivityEntityType, ActivityEntry } from "@/shared/types/activity";
import {
  getActivitiesForEntity,
  getRecentActivities,
  subscribeActivities,
} from "@/shared/utils/activity-store";

export function useEntityActivities(
  entityType: ActivityEntityType,
  entityId: string
): ActivityEntry[] {
  const [activities, setActivities] = useState(() =>
    getActivitiesForEntity(entityType, entityId)
  );

  useEffect(() => {
    const refresh = () => setActivities(getActivitiesForEntity(entityType, entityId));
    refresh();
    return subscribeActivities(refresh);
  }, [entityType, entityId]);

  return activities;
}

export function useRecentActivities(limit = 10): ActivityEntry[] {
  const [activities, setActivities] = useState(() => getRecentActivities(limit));

  useEffect(() => {
    const refresh = () => setActivities(getRecentActivities(limit));
    refresh();
    return subscribeActivities(refresh);
  }, [limit]);

  return activities;
}
