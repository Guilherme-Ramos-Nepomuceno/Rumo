import type { ActivityRecord, Category } from "./types"

// Seeded random number generator for consistent data
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

// Generate mock activity data for the last 365 days (called once)
function generateActivityData(): ActivityRecord[] {
  const data: ActivityRecord[] = []
  const categories: Category[] = ["study", "work", "training", "leisure", "water", "food", "home", "health", "others"]
  
  // Use a fixed date for consistent data generation
  const baseDate = new Date("2026-03-30")
  const random = seededRandom(12345) // Fixed seed for consistent data

  for (let i = 0; i < 365; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0) // Normalize time

    // Randomly generate activities for each category
    categories.forEach((category) => {
      const count = Math.floor(random() * 8) // 0-7 activities per day per category
      if (count > 0) {
        data.push({
          date,
          category,
          count,
        })
      }
    })
  }

  return data
}

// Generate data once and cache it
export const mockActivityData: ActivityRecord[] = []

// Create a lookup map for faster access
const activityLookup = new Map<string, Map<Category | "all", number>>()

// Pre-compute lookup table
mockActivityData.forEach((record) => {
  const dateKey = record.date.toDateString()
  
  if (!activityLookup.has(dateKey)) {
    activityLookup.set(dateKey, new Map())
  }
  
  const dateMap = activityLookup.get(dateKey)!
  
  // Update category-specific count
  const currentCategoryCount = dateMap.get(record.category) || 0
  dateMap.set(record.category, currentCategoryCount + record.count)
  
  // Update "all" count
  const currentAllCount = dateMap.get("all") || 0
  dateMap.set("all", currentAllCount + record.count)
})

// Optimized helper function using provided data
export function getActivityCount(data: ActivityRecord[], date: Date, category?: Category): number {
  if (!data) return 0
  const dateStr = date.toDateString()
  
  return data
    .filter(record => record.date.toDateString() === dateStr && (!category || record.category === category))
    .reduce((acc, record) => acc + record.count, 0)
}

export function getContributingCategories(data: ActivityRecord[], date: Date): Category[] {
  if (!data) return []
  const dateStr = date.toDateString()
  
  const categories = data
    .filter(record => record.date.toDateString() === dateStr && record.category && record.category !== 'others')
    .map(record => record.category as Category)
    
  return Array.from(new Set(categories))
}
