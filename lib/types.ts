export type Category = "study" | "work" | "training" | "leisure" | "water" | "food" | "home" | "health" | "others" | string

export type Difficulty = "very-easy" | "easy" | "medium" | "hard" | "very-hard"

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
  activeStartedAt?: number // timestamp ms — quando o Play foi clicado (sincronizado com backend)
  tags?: string[]
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

export interface Objective {
  id: string
  title: string
  description?: string
  categoryId?: string
  category?: { id: string; label: string; color?: string; icon?: string }
  targetDate?: Date
  status: 'active' | 'achieved' | 'abandoned'
  progress: number          // 0-100
  taskIds: string[]
  taskCount: number
  completedTaskCount: number
  createdAt?: Date
}

export interface CustomCategory {
  id: string
  label: string
  icon: string
  color: string
  synced?: boolean // false = criada localmente, aguardando confirmação do backend
}
