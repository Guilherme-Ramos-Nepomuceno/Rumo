# 🏠 Dashboard de Controle (Home)

O módulo **Home** é o centro nevrálgico do Rumo, onde as tarefas ativas são gerenciadas e o progresso diário é visualizado em tempo real.

---

## 🛠️ Especificações Técnicas

Este módulo é composto por uma orquestração de componentes reativos que se comunicam através do estado local (React State) e se sincronizam com o `localStorage`.

### Componentes Principais

1. **[KanbanBoard](file:///c:/Users/guilh/rumo/components/kanban-board.tsx)**:
   - Gerencia os estados `paused` (Em Pausa) e `in-progress` (Em Andamento).
   - Suporta **Drag-and-drop** e reordenação vertical manual.
   - Ações: Pausar, Continuar, Concluir, Reverter para Próximos e Excluir.

2. **[TaskCard](file:///c:/Users/guilh/rumo/components/task-card.tsx)**:
   - Componente visual de alta fidelidade com estados expandido/colapsado.
   - Utiliza **Framer Motion** para animações em cascata (staggered animations) com delay de 0.2s.

3. **[SummarySection](file:///c:/Users/guilh/rumo/components/summary-section.tsx)**:
   - Exibe o progresso diário e semanal através de métricas de completude.
   - Lista dinâmica de categorias com animações fluidas de entrada e saída.

4. **[ActivityTracker](file:///c:/Users/guilh/rumo/components/activity-tracker.tsx) & [PerformanceChart](file:///c:/Users/guilh/rumo/components/performance-chart.tsx)**:
   - Visualização de dados via **Recharts**, filtrando atividades por categoria e volume de execução.

---

## 📋 Regras de Negócio (Lógica de Execução)

A gestão de tarefas segue um fluxo rigoroso de ciclo de vida:

- **Ponto de Partida**: Tarefas em **"Próximos Objetivos"** estão no estado `pending`.
- **Ativação**: Ao iniciar uma tarefa, seu status muda para `in-progress` e o temporizador é inicializado.
- **Interrupção**: Uma tarefa `in-progress` pode ser movida para `paused`, preservando o `elapsedTime`.
- **Conclusão**: Tarefas só podem ser concluídas após atingirem o estado `in-progress`. Ao concluir, o usuário deve preencher o formulário de satisfação e dificuldade (Modal).
- **Repetição**: Tarefas concluídas podem ser clonadas instantaneamente, criando um novo registro com status `pending` e IDs únicos.

---

## 🔌 API & Eventos Internos

Embora o Rumo não utilize uma API externa no momento, os principais disparadores de estado são:

| Função | Trigger | Efeito |
|--------|---------|--------|
| `handleStartTask(id)` | Clique em Play | Status -> `in-progress` |
| `handlePauseTask(id)` | Clique em Pause | Status -> `paused` |
| `handleRevertToPending(id)` | Menu ... -> Reverter | Status -> `pending` |
| `handleRepeatTask(task)` | Clique em Repetir | Nova tarefa em `pending` |

---

### Execução em Código (Exemplo Interno)

```typescript
// Exemplo de como uma tarefa é movida para 'Próximos Objetivos'
const handleRevertToPending = (taskId: string) => {
  setTasks((prev) => prev.map((t) => 
    t.id === taskId ? { ...t, status: "pending", progress: 0, elapsedTime: 0 } : t
  ))
}
```

---
© 2026 Rumo Project.
