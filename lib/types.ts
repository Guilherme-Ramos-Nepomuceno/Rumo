export type Category = "study" | "work" | "training" | "leisure" | "water" | "food" | "home" | "health" | "others" | string

export type Difficulty = "very-easy" | "easy" | "medium" | "hard" | "very-hard"

export type Importance =
  | "urgent-important"
  | "not-urgent-important"
  | "urgent-not-important"
  | "not-urgent-not-important"

export interface Subtask {
  id: string
  title: string
  estimatedTime: number // em segundos
  elapsedTime: number // em segundos
  completed: boolean
  completedAt?: Date
}

export interface Task {
  id: string
  title: string
  description: string
  category: Category
  startDate: Date
  endDate: Date
  startTime?: string
  endTime?: string
  isPeriodic: boolean
  periodicInterval?: {
    value: number
    unit: "days" | "weeks" | "months"
  }
  subtasks?: Subtask[]
  currentSubtaskIndex?: number
  comments?: string
  expectedDifficulty?: Difficulty
  expectedSatisfaction?: number
  actualDifficulty?: Difficulty
  actualSatisfaction?: number
  status: "pending" | "in-progress" | "paused" | "completed"
  progress: number
  estimatedTime?: number // em segundos
  elapsedTime?: number // em segundos
  tags?: string[]
  importance: Importance
  order: number
  completedAt?: Date
}

export interface DailySummary {
  date: Date
  totalTasks: number
  completedTasks: number
  byCategory: Record<Category, number>
}

export interface ActivityRecord {
  date: Date
  category: Category
  count: number
}

export type TimeView = "day" | "week" | "month" | "semester" | "year"

export interface CategoryDefinition {
  id: string
  label: string
  icon: string
  color: string
}

export interface CustomCategory {
  id: string
  label: string
  icon: string
  color: string
}
