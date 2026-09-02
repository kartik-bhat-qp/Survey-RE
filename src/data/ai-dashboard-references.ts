export interface DashboardReferenceSelection {
  dashboardIds: number[];
  themeReferenceDashboardId: number | null;
}

export function toggleDashboardReference(
  selection: DashboardReferenceSelection,
  dashboardId: number,
  maximumReferences = 5
): DashboardReferenceSelection {
  const isSelected = selection.dashboardIds.includes(dashboardId);

  if (isSelected) {
    const dashboardIds = selection.dashboardIds.filter((id) => id !== dashboardId);

    return {
      dashboardIds,
      themeReferenceDashboardId:
        selection.themeReferenceDashboardId === dashboardId
          ? (dashboardIds[0] ?? null)
          : selection.themeReferenceDashboardId,
    };
  }

  if (selection.dashboardIds.length >= maximumReferences) {
    return selection;
  }

  return {
    dashboardIds: [...selection.dashboardIds, dashboardId],
    themeReferenceDashboardId: selection.themeReferenceDashboardId ?? dashboardId,
  };
}

export function selectThemeReference(
  selection: DashboardReferenceSelection,
  dashboardId: number
): DashboardReferenceSelection {
  if (!selection.dashboardIds.includes(dashboardId)) {
    return selection;
  }

  return {
    ...selection,
    themeReferenceDashboardId: dashboardId,
  };
}
