"use client";

import type { Task, CustomCategory, ActivityRecord } from "./types";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";

async function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

async function ensureSync() {
  if (navigator.onLine) {
    await api.sync.processQueue();
  }
}

// Declarative field name overrides — keeps business rules visible and separate
// from the generic camelCase ↔ snake_case transformation below.
const CAMEL_TO_SNAKE: Record<string, string> = {
  category:   "category_id",
  categoryId: "category_id",
}
const SNAKE_TO_CAMEL: Record<string, string> = {
  category_id: "category",
}

function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  if (obj instanceof Date) return obj.toISOString()
  if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    const result: any = {}
    for (const key in obj) {
      // Structural transform: periodicInterval object → two flat fields
      if (key === "periodicInterval" && obj[key]) {
        result["periodic_value"] = obj[key].value
        result["periodic_unit"] = obj[key].unit
        continue
      }
      // Unwrap category objects to their ID string
      let value = obj[key]
      if ((key === "category" || key === "categoryId") && value && typeof value === "object" && value.id) {
        value = value.id
      }
      // activeStartedAt is stored as ms timestamp in frontend state — convert to ISO string for the API
      if (key === "activeStartedAt" && typeof value === "number") {
        value = new Date(value).toISOString()
      }
      const snakeKey = CAMEL_TO_SNAKE[key] ?? key.replace(/([A-Z])/g, "_$1").toLowerCase()
      result[snakeKey] = toSnakeCase(value)
    }
    return result
  }
  return obj
}

function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    const result: any = {}
    for (const key in obj) {
      // Structural transform: two flat fields → periodicInterval object
      if (key === "periodic_value" && obj[key] !== undefined) {
        result["periodicInterval"] = { ...result["periodicInterval"], value: obj[key] }
        continue
      }
      if (key === "periodic_unit" && obj[key] !== undefined) {
        result["periodicInterval"] = { ...result["periodicInterval"], unit: obj[key] }
        continue
      }
      const camelKey = SNAKE_TO_CAMEL[key] ?? key.replace(/(_[a-z])/g, g => g[1].toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
    }
    return result
  }
  return obj
}

async function request(path: string, options: RequestInit = {}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("current_user");
    if (typeof window !== "undefined") {
      document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
      window.location.href = "/login";
    }
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }

  return response;
}

export const api = {
  auth: {
    async login(credentials: any) {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error("Credenciais inválidas");
      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("current_user", JSON.stringify(data.user));
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      return data;
    },
    async register(data: any) {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar conta");
      return response.json();
    },
    async logout() {
      await request("/auth/logout", { method: "POST" });
      localStorage.removeItem("token");
      localStorage.removeItem("current_user");
      document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    }
  },

  tasks: {
    async list(): Promise<{ tasks: Task[], categories: CustomCategory[], activityCount: number }> {
      const response = await request("/tasks");
      if (!response.ok) throw new Error("Erro ao carregar tarefas");
      const json = await response.json();
      return {
        tasks: toCamelCase(json.data),
        categories: toCamelCase(json.categories),
        activityCount: json.activity_count
      };
    },

    async history(page: number = 1): Promise<{ tasks: Task[], hasMore: boolean }> {
      const response = await request(`/tasks/history?page=${page}`);
      if (!response.ok) throw new Error("Erro ao carregar histórico");
      const json = await response.json();
      const tasks = toCamelCase(json.data || []);
      const hasMore = json.meta?.has_more_pages || json.links?.next !== null;
      return { tasks, hasMore };
    },

    async create(task: Task): Promise<Task> {
      await ensureSync();
      const response = await request("/tasks", {
        method: "POST",
        body: JSON.stringify(toSnakeCase(task)),
      });
      if (!response.ok) throw new Error("Erro ao criar tarefa");
      const json = await response.json();
      const data = json.data || json;
      return toCamelCase(data);
    },

    async update(taskId: string, task: Partial<Task>): Promise<Task> {
      await ensureSync();
      const response = await request(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(toSnakeCase(task)),
      });
      if (!response.ok) throw new Error("Erro ao atualizar tarefa");
      const json = await response.json();
      const data = json.data || json;
      return toCamelCase(data);
    },

    async delete(taskId: string): Promise<void> {
      await ensureSync();
      const response = await request(`/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir tarefa");
    },

    async clearAll(): Promise<void> {
      await ensureSync();
      const response = await request("/tasks", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao limpar dados");
    },
  },

  objectives: {
    async list(): Promise<any[]> {
      const response = await request("/objectives")
      if (!response.ok) throw new Error("Erro ao carregar objetivos")
      const json = await response.json()
      return toCamelCase(json)
    },
    async create(data: { title: string; description?: string; categoryId?: string; targetDate?: string }): Promise<any> {
      const response = await request("/objectives", { method: "POST", body: JSON.stringify(toSnakeCase(data)) })
      if (!response.ok) throw new Error("Erro ao criar objetivo")
      return toCamelCase(await response.json())
    },
    async update(id: string, data: Partial<{ title: string; description: string; categoryId: string; targetDate: string; status: string }>): Promise<any> {
      const response = await request(`/objectives/${id}`, { method: "PUT", body: JSON.stringify(toSnakeCase(data)) })
      if (!response.ok) throw new Error("Erro ao atualizar objetivo")
      return toCamelCase(await response.json())
    },
    async delete(id: string): Promise<void> {
      const response = await request(`/objectives/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Erro ao excluir objetivo")
    },
    async attachTask(objectiveId: string, taskId: string): Promise<any> {
      const response = await request(`/objectives/${objectiveId}/tasks/${taskId}`, { method: "POST" })
      if (!response.ok) throw new Error("Erro ao vincular tarefa")
      return toCamelCase(await response.json())
    },
    async detachTask(objectiveId: string, taskId: string): Promise<any> {
      const response = await request(`/objectives/${objectiveId}/tasks/${taskId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Erro ao desvincular tarefa")
      return toCamelCase(await response.json())
    },
  },

  categories: {
    async list(): Promise<CustomCategory[]> {
      await ensureSync();
      const response = await request("/categories");
      if (!response.ok) throw new Error("Erro ao carregar categorias");
      const json = await response.json();
      const data = json.data || json;
      return toCamelCase(data);
    },

    async create(category: CustomCategory): Promise<CustomCategory> {
      await ensureSync();
      const response = await request("/categories", {
        method: "POST",
        body: JSON.stringify(toSnakeCase(category)),
      });
      if (!response.ok) throw new Error("Erro ao criar categoria");
      const json = await response.json();
      const data = json.data || json;
      return toCamelCase(data);
    },

    async update(id: string, data: Partial<Pick<CustomCategory, 'label' | 'color' | 'icon'>>): Promise<CustomCategory> {
      const response = await request(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) throw new Error("Erro ao atualizar categoria");
      const json = await response.json();
      return toCamelCase(json.data || json);
    },

    async delete(id: string): Promise<void> {
      const response = await request(`/categories/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir categoria");
    },
  },

  subtasks: {
    async tick(subtaskId: string, elapsedTimeIncrement: number = 0): Promise<Task> {
      await ensureSync();
      const response = await request(`/subtasks/${subtaskId}/tick`, {
        method: "PATCH",
        body: JSON.stringify(toSnakeCase({ elapsedTimeIncrement })),
      });
      if (!response.ok) throw new Error("Erro ao atualizar subtarefa");
      const json = await response.json();
      const data = json.data || json;
      return toCamelCase(data);
    },
  },

  stats: {
    async activity(params: { startDate?: string; endDate?: string; categoryId?: string } = {}): Promise<ActivityRecord[]> {
      const mappedParams: any = {
        start_date: params.startDate,
        end_date: params.endDate,
        category_id: params.categoryId
      };
      
      // Remover campos indefinidos
      Object.keys(mappedParams).forEach(key => mappedParams[key] === undefined && delete mappedParams[key]);

      const query = new URLSearchParams(mappedParams).toString();
      const response = await request(`/stats/activity?${query}`);
      if (!response.ok) throw new Error("Erro ao carregar atividades");
      const json = await response.json();
      return json.data.map((item: any) => {
        const [year, month, day] = item.date.split("-").map(Number);
        return {
          ...item,
          date: new Date(year, month - 1, day)
        };
      });
    },

    async performance(params: { month?: string; categoryId?: string } = {}): Promise<any[]> {
      const mappedParams: any = {
        month: params.month,
        category_id: params.categoryId
      };

      // Remover campos indefinidos
      Object.keys(mappedParams).forEach(key => mappedParams[key] === undefined && delete mappedParams[key]);

      const query = new URLSearchParams(mappedParams).toString();
      const response = await request(`/stats/performance?${query}`);
      if (!response.ok) throw new Error("Erro ao carregar performance");
      const json = await response.json();
      return json.data.map((item: any) => {
        const [year, month, day] = item.date.split("-").map(Number);
        return {
          id: item.id,
          title: item.title,
          date: new Date(year, month - 1, day),
          category: item.category,
          expectedDifficulty: item.expected_difficulty,
          actualDifficulty: item.actual_difficulty,
          expectedSatisfaction: item.expected_satisfaction,
          actualSatisfaction: item.actual_satisfaction,
          elapsedTime: item.elapsed_time,
          isPeriodic: item.is_periodic,
        };
      });
    },

    async weeklyReview(week?: string): Promise<any> {
      const query = week ? `?week=${encodeURIComponent(week)}` : ""
      const response = await request(`/stats/weekly-review${query}`)
      if (!response.ok) throw new Error("Erro ao carregar revisão semanal")
      return toCamelCase(await response.json())
    },

    async estimationPatterns(params: { categoryId?: string; expectedDifficulty?: string } = {}): Promise<{
      sampleSize: number
      avgEstimatedSeconds: number
      avgActualSeconds: number
      biasPct: number
    } | null> {
      const query = new URLSearchParams()
      if (params.categoryId) query.set("category_id", params.categoryId)
      if (params.expectedDifficulty) query.set("expected_difficulty", params.expectedDifficulty)
      const response = await request(`/stats/estimation-patterns?${query}`)
      if (!response.ok) return null
      const json = await response.json()
      if (!json.sample_size) return null
      return {
        sampleSize: json.sample_size,
        avgEstimatedSeconds: json.avg_estimated_seconds,
        avgActualSeconds: json.avg_actual_seconds,
        biasPct: json.bias_pct,
      }
    },
  },

  sync: {
    async processQueue() {
      const queue = JSON.parse(localStorage.getItem("rumo_syncQueue") || "[]");
      if (queue.length === 0) return;

      const response = await request("/sync", {
        method: "POST",
        body: JSON.stringify(toSnakeCase(queue)),
      });

      if (response.ok) {
        localStorage.setItem("rumo_syncQueue", "[]");
      }
    },

    push(action: string, payload: any) {
      const queue = JSON.parse(localStorage.getItem("rumo_syncQueue") || "[]");
      queue.push({
        id: crypto.randomUUID(),
        action,
        payload,
        timestamp: new Date().toISOString(),
      });

      // ✅ Limita a fila a 100 items para evitar crescimento infinito
      if (queue.length > 100) {
        queue.shift();  // Remove o item mais antigo
      }

      localStorage.setItem("rumo_syncQueue", JSON.stringify(queue));
    }
  }
};
