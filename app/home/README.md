# Dashboard de Controle (Home)

O módulo **Home** é o centro nevrálgico do Rumo, onde as tarefas ativas são gerenciadas e o progresso diário é visualizado em tempo real.

---

## Especificações Técnicas

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

4. **[ActivityTracker](file:///c:///Users/guilh/rumo/components/activity-tracker.tsx)**:
   - Reconstruído no visual exato do **GitHub Contribution Graph** (7 linhas representativas dos dias da semana de Domingo a Sábado e colunas roláveis que representam as semanas).
   - Apresenta um **Painel de Estatísticas Premium** (Streak de consistência, Média Diária, Total Concluído e Dia Mais Produtivo).
   - Possui micro-animações de escala progressiva e sombra brilhante com a cor da categoria ao passar o mouse.
   - Exibe tanto tarefas concluídas quanto as ativas em planejamento ("Próximos Objetivos") em todas as visualizações (Dia, Semana, Mês, Semestre, Ano).
   - Dias sem entregas concluídas mas com tarefas agendadas são exibidos com estilo vazado premium (bordas tracejadas e preenchimento translúcido da cor da categoria).
   - Fornece um tooltip unificado de alta fidelidade detalhando todas as atividades concluídas (com duração real gasta) e planejadas (com horários agendados e status ativo) para aquele bloco/dia específico.
   - Suporta visualizações adicionais de **Dia** (linha do tempo de 24h) e **Mês** (grade de calendário mensal expandida com numeração).

5. **[PerformanceChart](file:///c:///Users/guilh/rumo/components/performance-chart.tsx)**:
   - **Upgrade Estatístico Metacognitivo**: Transforma a visualização simples de performance em uma ferramenta de calibração de dissonância cognitiva.
   - **Evita Cancelamento de Desvios (Statistical Masking)**: No modo agrupado diário, o gráfico calcula dinamicamente o **Desvio Absoluto Médio (MAD)** de cada tarefa para exibir na tooltip, impedindo que desvios opostos no mesmo dia se anulem e mascarem a autopercepção real.
   - **Visão por Tarefa (Individual)**: Adicionado um seletor de agrupamento que permite visualizar cada tarefa cronologicamente individual no eixo X, eliminando qualquer agregação.
   - **Gráfico de Divergência (Desvio)**: Integra visualização em barras horizontais e verticais plotando o desvio absoluto (`Realizado - Esperado`). Barras positivas indicam subestimação da demanda (esforço real superior ao esperado), enquanto barras negativas apontam superestimação (ansiedade ou superdimensionamento).
   - **Painel de Calibração Metacognitiva**:
     - **Precisão de Calibração (Alinhamento %)**: Calculada em tempo real com base no desvio absoluto normalizado.
     - **Distribuição de Quadrantes**: Barra horizontal tri-segmentada animada dividida nas proporções de tarefas **Superestimadas**, **Alinhadas**, e **Subestimadas**.
     - **Diagnóstico Comportamental**: Algoritmo que gera interpretações clínicas/psicológicas baseadas no Viés estatístico acumulado (ex: alertas de exaustão por subestimação constante).
   - **Legendas Ocas e Símbolos Vazados**: Legenda e linha de dados "Esperado" renderizadas com círculos verdadeiramente vazados (bordas sólidas e centro 100% transparente), permitindo visualização das linhas de grade por trás para distinção imediata.
   - **Empty State**: Estado vazio estilizado em vidro de alta conversão visual quando nenhuma atividade foi concluída no período.

6. **Task Time Tags / Badges**:
   - Integrado tags/badges elegantes de horário agendado (`Clock` icon) nos cabeçalhos e painéis do `TaskDetailModal`, `TaskCard` e `KanbanCard` para que o período planejado esteja visível imediatamente de qualquer tela.

7. **[NewTaskModal](file:///c:///Users/guilh/rumo/components/new-task-modal.tsx)**:
   - Modal premium estilizado no padrão **iOS Notes** para criação de novas metas.
   - Substitui seletores brutos de data por um calendário Radix `Popover` + `Calendar` (`ptBR`).
   - Apresenta o **Cupertino Scroll Wheel TimePicker** (spinner de relógio 3D que simula perfeitamente o visual e a rolagem cilíndrica do iPhone com efeitos de perspectiva realistas e efeito snap de rolagem).

---

## Regras de Negócio (Lógica de Execução)

A gestão de tarefas e estatísticas segue um fluxo rigoroso de ciclo de vida e consistência:

- **Ponto de Partida**: Tarefas em **"Próximos Objetivos"** estão no estado `pending`.
- **Ativação**: Ao iniciar uma tarefa, seu status muda para `in-progress` e o temporizador é inicializado.
- **Interrupção**: Uma tarefa `in-progress` pode ser movida para `paused`, preservando o `elapsedTime`.
- **Conclusão**: Tarefas só podem ser concluídas após atingirem o estado `in-progress`. Ao concluir, o usuário deve preencher o formulário de satisfação e dificuldade (Modal).
- **Repetição**: Tarefas concluídas podem ser clonadas instantaneamente, criando um novo registro com status `pending` e IDs únicos.
- **Limpeza de Dados**: A ação "Limpar Todos os Dados" remove localmente todos os registros de tarefas e emite um comando de deleção em massa ao banco de dados, expurgando de forma irreversível todas as tarefas, sub-tarefas e estatísticas do usuário autenticado.

### Reatividade Estatística e Fuso Horário (Timezone)

- **Correção de Timezone**: Para evitar deslocamentos de dias causados por fusos horários locais em relação às strings UTC fornecidas pelo backend (ex: `"2026-05-26"` parsed em UTC torna-se `25/05` no fuso de Brasília), a camada de rede do Next.js analisa as datas usando decomposição de string local (`item.date.split("-")`), instanciando `new Date(year, month - 1, day)`. Isso garante exatidão de 100% no calendário e nos gráficos.
- **Reatividade Automática**: Ao salvar um formulário de conclusão de tarefa via `handleCompletionSubmit()`, o sistema dispara em segundo plano o recarregamento das métricas de atividade (`fetchActivityData`) e performance (`fetchPerformanceData`) baseado nos filtros atuais já aplicados nos cards do dashboard, eliminando qualquer necessidade de reload de página.
- **Consistência de Eixos**: A chave de data compartilhada com o `XAxis` do Recharts no modo "Todas Categorias" foi unificada como string `"YYYY-MM-DD"`, impedindo falhas internas no algoritmo de deduplicação e renderização de linhas de dados do Recharts.

---

## API & Eventos Consumidos

O módulo sincroniza com a API Laravel do **Rumo Backend** através dos seguintes endpoints e disparadores:

### Endpoints Consumidos

| Recurso | Método | Endpoint | Descrição |
|---------|--------|----------|-----------|
| Listar Tarefas | `GET` | `/api/v1/tasks` | Busca tarefas ativas, categorias e métricas diárias. |
| Criar Tarefa | `POST` | `/api/v1/tasks` | Registra uma nova tarefa e suas subtarefas na base. |
| Atualizar Tarefa | `PUT` | `/api/v1/tasks/{id}` | Atualiza progresso, status ou tempos da atividade. |
| Deletar Tarefa | `DELETE` | `/api/v1/tasks/{id}` | Remove uma tarefa individual do usuário. |
| Limpar Todos os Dados | `DELETE` | `/api/v1/tasks` | Deleção em massa de todas as tarefas da conta do usuário. |

### Disparadores de Estado Locais

| Função | Trigger | Efeito | Sincronização API |
|--------|---------|--------|-------------------|
| `handleStartTask(id)` | Clique em Play | Status -> `in-progress` | `PUT /tasks/{id}` com `status: "in-progress"` |
| `handlePauseTask(id)` | Clique em Pause | Status -> `paused` | `PUT /tasks/{id}` com `status: "paused"` |
| `handleClearAll()` | Limpar dados | Zera arrays locais e localStorage | `DELETE /tasks` (limpeza global) |
| `handleAddTask(data)` | Submit do NewTaskModal | Cria e insere meta no Dashboard | `POST /tasks` com dados de formulário |

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
