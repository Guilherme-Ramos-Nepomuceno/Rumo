import type { Task, CustomCategory } from "@/lib/types"

const LEGACY_LABELS: Record<string, string> = {
  study: "Estudo", work: "Trabalho", training: "Treino", leisure: "Lazer",
  water: "Água", food: "Alimentação", home: "Casa", health: "Saúde", others: "Outros",
}

/**
 * Converts a raw API/localStorage task object into a typed Task,
 * normalising dates and resolving the category field.
 */
export function parseTask(t: any): Task {
  let category = t.category
  if (typeof t.category === "object" && t.category !== null) {
    category = t.category.id
  } else if (t.categoryId) {
    category = t.categoryId
  } else if (t.category_id) {
    category = t.category_id
  }

  return {
    ...t,
    category,
    startDate:       t.startDate       ? new Date(t.startDate)                        : new Date(),
    endDate:         t.endDate         ? new Date(t.endDate)                          : new Date(),
    createdAt:       t.createdAt       ? new Date(t.createdAt)                        : undefined,
    completedAt:     t.completedAt     ? new Date(t.completedAt)                      : undefined,
    activeStartedAt: t.activeStartedAt ? new Date(t.activeStartedAt).getTime()        : undefined,
    subtasks: t.subtasks?.map((st: any) => ({
      ...st,
      completedAt: st.completedAt ? new Date(st.completedAt) : undefined,
    })),
  }
}

/**
 * Resolves a category ID to its display properties.
 * Returns label, CSS color string, icon name (Lucide), and whether it's custom.
 */
export function resolveCategoryConfig(
  categoryId: string,
  customCategories: CustomCategory[],
  fallbackLabel?: string,
): { label: string; color: string; iconName: string; isCustom: boolean } {
  const match = customCategories.find(c => c.id === categoryId)
  if (match) {
    return {
      label:    match.label,
      color:    match.color || "#94a3b8",
      iconName: match.icon  || "Circle",
      isCustom: true,
    }
  }
  return {
    label:    LEGACY_LABELS[categoryId] || fallbackLabel || categoryId || "Outros",
    color:    "#94a3b8",
    iconName: "Circle",
    isCustom: false,
  }
}
