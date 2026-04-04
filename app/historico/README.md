# 📜 Módulo Histórico de Tarefas

O módulo **Histórico** fornece uma trilha de auditoria completa e visual das conquistas passadas, permitindo que o usuário analise padrões de produtividade e satisfação.

---

## 🏗️ Especificações Técnicas

O histórico é alimentado exclusivamente pelo estado de `completedTasks`, que persiste no **LocalStorage**.

### Componentes Principais

1. **[CompletedTasksSection](file:///c:/Users/guilh/rumo/components/completed-tasks-section.tsx)**:
   - Componente de visualização em lista.
   - Exibe metadados de conclusão: Satisfação (Estrelas), Dificuldade e Tempo Decorrido.
   - Ação: **Repetir Tarefa** (ícone `RotateCcw`).

---

## 📋 Regras de Negócio (Auditoria)

- **Imutabilidade de Registro**: Uma vez arquivada, a tarefa concluída não é editada, apenas visualizada ou clonada (Repetir).
- **Ordenação**: O histórico é exibido em ordem cronológica reversa (mais recente primeiro).
- **Transformação de Dados**: O módulo formata os campos `elapsedTime` (segundos) em strings legíveis (ex: `1h 30m`) e `completedAt` (Date) para o padrão local `pt-BR`.

---

## 🔌 API & Eventos Internos

A principal interface de integração deste módulo com o Dashboard principal é a função de repetição:

| Evento | Trigger | Efeito |
|--------|---------|--------|
| `onRepeat(task)` | Clique no ícone de repetição | Clona a tarefa para a fila de `pending` no Dashboard. |

---

### Exemplo de Uso (Componente Reutilizável)

```tsx
<CompletedTasksSection 
  tasks={completedTasks} 
  onRepeat={handleRepeatTask} 
  customCategories={customCategories} 
/>
```

---
© 2026 Rumo Project.
