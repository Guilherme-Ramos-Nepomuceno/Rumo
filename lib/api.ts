"use client";

import type { Task, CustomCategory } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";

async function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

async function ensureSync() {
  if (navigator.onLine) {
    await api.sync.processQueue();
  }
}

function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj instanceof Date) {
    return obj.toISOString();
  } else if (obj !== null && typeof obj === 'object') {
    // Se for um objeto mas não um literal (ex: ArrayBuffer, etc), retorna como está
    if (obj.constructor !== Object && !Array.isArray(obj)) return obj;

    const result: any = {};
    for (const key in obj) {
      let snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      let value = obj[key];

      // Mapeamentos específicos e garantias para Categoria
      if (key === "category" || key === "categoryId") {
        snakeKey = "category_id";
        // Se por algum motivo o front passar o objeto da categoria, pegamos o ID
        if (value && typeof value === 'object' && value.id) {
          value = value.id;
        }
      }
      
      if (key === "periodicInterval" && value) {
        result["periodic_value"] = value.value;
        result["periodic_unit"] = value.unit;
        continue;
      }

      result[snakeKey] = toSnakeCase(value);
    }
    return result;
  }
  return obj;
}

function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const key in obj) {
      let camelKey = key.replace(/(_[a-z])/g, (group) =>
        group.toUpperCase().replace("_", "")
      );
      let value = obj[key];

      // Mapeamentos específicos
      if (key === "category_id") camelKey = "category";
      if (key === "periodic_value" && value !== undefined) {
          result["periodicInterval"] = {
              ...result["periodicInterval"],
              value: value
          };
          continue;
      }
      if (key === "periodic_unit" && value !== undefined) {
          result["periodicInterval"] = {
              ...result["periodicInterval"],
              unit: value
          };
          continue;
      }

      result[camelKey] = toCamelCase(value);
    }
    return result;
  }
  return obj;
}

async function request(path: string, options: RequestInit = {}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }

  return response;
}

export const api = {
  auth: {
    async login(credentials: any) {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error("Credenciais inválidas");
      const data = await response.json();
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("current_user", JSON.stringify(data.user));
      return data;
    },
    async register(data: any) {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar conta");
      return response.json();
    },
    async logout() {
      await request("/auth/logout", { method: "POST" });
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_user");
    }
  },

  tasks: {
    async list(): Promise<{ tasks: Task[], categories: CustomCategory[], activityCount: number }> {
      await ensureSync();
      const response = await request("/tasks");
      if (!response.ok) throw new Error("Erro ao carregar tarefas");
      const json = await response.json();
      return {
        tasks: toCamelCase(json.data),
        categories: toCamelCase(json.categories),
        activityCount: json.activity_count
      };
    },

    async history(): Promise<Task[]> {
      await ensureSync();
      const response = await request("/tasks/history");
      if (!response.ok) throw new Error("Erro ao carregar histórico");
      const json = await response.json();
      const data = json.data || json;
      return toCamelCase(data);
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
      return json.data.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
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
      return json.data.map((item: any) => ({
        date: new Date(item.date),
        category: item.category,
        expectedDifficulty: item.expected_difficulty,
        actualDifficulty: item.actual_difficulty,
        expectedSatisfaction: item.expected_satisfaction,
        actualSatisfaction: item.actual_satisfaction
      }));
    }
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
      localStorage.setItem("rumo_syncQueue", JSON.stringify(queue));
    }
  }
};
