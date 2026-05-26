# ✅ TEST CHECKLIST - Memory Leak Fix Verification

Use este checklist para confirmar que o infinite loop e memory leaks foram corrigidos.

---

## 🔧 Pre-Test Setup

- [ ] Iniciar aplicação com `npm run dev`
- [ ] Aguardar 10 segundos para aplicação iniciar completamente
- [ ] Abrir DevTools (F12) em http://localhost:3000
- [ ] Limpar cache de localStorage (DevTools → Application → Local Storage → Clear All)
- [ ] Abrir Task Manager (Ctrl+Shift+Esc) em Windows

---

## 🧪 TEST 1: Memory Usage Verification

### Objetivo
Confirmar que Node.js não está mais consumindo 1.5GB de memória.

### Passos
1. [ ] Abrir Task Manager
2. [ ] Procurar por "node.exe" na aba "Detalhes"
3. [ ] Anotar memory inicial (deve estar entre 100-250MB)
4. [ ] **Expected**: 100-300MB (✅ PASS) ou >800MB (❌ FAIL)

### Critério de Sucesso
- ✅ Memory entre 100-300MB
- ✅ Memory NÃO cresce indefinidamente enquanto usa a app
- ✅ VmmemWSL está abaixo de 3GB (seu Docker está ok)

### Se FALHAR
- [ ] Matar processo Node.js (Task Manager → End Task)
- [ ] Rodar `npm run dev` novamente
- [ ] Verificar se há múltiplas instâncias de node
- [ ] Contatar dev se continuar > 800MB

---

## 🌐 TEST 2: Network Activity Verification

### Objetivo
Confirmar que API calls estão sendo debounced (menos requests).

### Passos
1. [ ] DevTools → Network tab
2. [ ] Criar 5 tarefas **rapidamente** (clique+enter, não espere)
3. [ ] Observar quantos requests de API aparecem

### Critério de Sucesso
- ✅ **3-5 requests** aparecem (não 10-15)
- ✅ Requests têm delay de 1-2 segundos entre eles
- ✅ Nenhum request está "pendente" (Pending)

### Esperado vs Ruim
| Esperado | Ruim |
|----------|------|
| 3-5 requests | 15+ requests |
| Delay entre | Todos imediatos |
| Alguns GET /tasks | Duplicados |

### Se FALHAR
- [ ] Network ainda mostra 10+ requests?
- [ ] Verificar se há múltiplas navegadores abertos
- [ ] Limpar cache do navegador (Ctrl+Shift+Delete)
- [ ] Desabilitar extensions que fazem polling

---

## 💾 TEST 3: localStorage Write Frequency

### Objetivo
Confirmar que localStorage não está sendo escrito a cada keystroke.

### Passos
1. [ ] DevTools → Application tab
2. [ ] Abrir localStorage → selecionar o domínio
3. [ ] Anotar timestamp na coluna "Value" (ex: `2026-05-26T10:15:30Z`)
4. [ ] Editar 10 tarefas rapidamente (mudar título, descrição, etc)
5. [ ] Observar quantas vezes os timestamps em localStorage mudaram

### Critério de Sucesso
- ✅ localStorage atualizado **1-2 vezes** durante 10 edições
- ✅ Há **delay de ~2 segundos** entre updates
- ✅ Não atualiza a cada keystroke

### Se FALHAR
- [ ] localStorage ainda atualiza 10+ vezes durante 10 edições?
- [ ] Verificar browser console para erros
- [ ] Confirmar que as mudanças em `use-dashboard.ts` foram aplicadas

---

## 📊 TEST 4: Rendering Performance

### Objetivo
Confirmar que componentes não estão re-renderizando infinitamente.

### Passos (Requer React DevTools Extension)
1. [ ] Instalar React DevTools Extension (Chrome/Firefox)
2. [ ] DevTools → Components → Profiler tab
3. [ ] Clicar em botão "Record"
4. [ ] Criar 3 tarefas rapidamente
5. [ ] Parar gravação
6. [ ] Observar graph de renders

### Critério de Sucesso
- ✅ Renders mostram padrão claro (spikes discretos)
- ✅ Cada tarefa criada = 1 spike (não múltiplos)
- ✅ Renders levam <100ms cada

### Se FALHAR
- [ ] Renders contínuos (vermelho sempre)?
- [ ] Cada ação causa 10+ renders?
- [ ] Verificar Activity Tracker component

---

## ⚡ TEST 5: UI Responsiveness

### Objetivo
Confirmar que UI não está travando ou lenta.

### Passos
1. [ ] Abrir aplicação
2. [ ] Criar uma tarefa
3. [ ] Começar a editar (mudar título)
4. [ ] Enquanto edita, criar outra tarefa
5. [ ] Completar uma tarefa

### Critério de Sucesso
- ✅ Typing em input é fluido (sem lag)
- ✅ Botões respondem imediatamente (<100ms)
- ✅ Sem freezes durante ações
- ✅ Modal abre/fecha rapidamente

### Se FALHAR
- [ ] UI está lenta/travando?
- [ ] Typing lag > 500ms?
- [ ] Verificar se Node.js está com problema (TEST 1)

---

## 🔄 TEST 6: Multiple Rapid Actions Stress Test

### Objetivo
Confirmar que aplicação aguenta múltiplas ações rapidamente.

### Passos (Advanced)
1. [ ] Monitorar memory em Task Manager (janela ao lado)
2. [ ] Criar 20 tarefas tão rápido quanto possível (botão novo → editar → salvar)
3. [ ] Editar 20 tarefas rapidamente
4. [ ] Completar 5 tarefas
5. [ ] Observar memory do Node.js durante todo o processo

### Critério de Sucesso
- ✅ Memory cresce para ~300-400MB no pico
- ✅ Memory volta a ~150-200MB após ações terminarem
- ✅ **Memory NÃO cresce para 1GB+**
- ✅ Nenhum erro no console

### Se FALHAR
- [ ] Memory cresceu para 1GB+?
- [ ] Ficou travado durante ações?
- [ ] Há erros no console?
- [ ] Network mostra 100+ requests?

---

## 🎯 TEST 7: Logout/Login Cycle

### Objetivo
Confirmar que memory é liberada quando logout.

### Passos
1. [ ] Anotar memory antes (Task Manager)
2. [ ] Fazer logout
3. [ ] Fazer login novamente
4. [ ] Anotar memory após

### Critério de Sucesso
- ✅ Memory após logout/login similar ao inicial
- ✅ Cache antigo foi liberado
- ✅ Sem memory creep ao longo do tempo

### Se FALHAR
- [ ] Memory não volta ao baseline?
- [ ] Há memory leak na página de login?

---

## 📋 FINAL CHECKLIST

### Testes que PASSARAM
- [ ] TEST 1: Memory ✅
- [ ] TEST 2: Network ✅
- [ ] TEST 3: localStorage ✅
- [ ] TEST 4: Rendering ✅
- [ ] TEST 5: Responsiveness ✅
- [ ] TEST 6: Stress Test ✅
- [ ] TEST 7: Logout/Login ✅

### Status Final

**Se ✅ em TODOS os testes:**
```
🎉 MEMORY LEAK FIXED! 
   Aplicação está estável e pronta para produção.
```

**Se ❌ em alguns testes:**
```
⚠️  Há ainda problemas a investigar.
   Contatar dev com resultado de cada teste.
```

---

## 📝 Notas Importantes

1. **Limpar Cache Antes de Testar**
   - Ctrl+Shift+Delete → Clear browsing data
   - Recarregar página com Ctrl+F5

2. **Task Manager deve estar no 1º Plano**
   - Não minimize a janela (afeta medições)
   - Pode atrapalhar UI (esperado)

3. **Network Tab**
   - Filtrar por "activity" ou "stats" para ver API calls relevantes
   - Ignora requests de assets (CSS, JS, etc)

4. **Multiple Tabs**
   - Usar apenas 1 aba da app
   - Outras abas também consomem memory

5. **Extensions**
   - Desabilitar extensions que fazem polling
   - Ad blockers, analytics, etc podem interferir

---

## 🆘 Troubleshooting

### "Memory still 1GB+"
- [ ] Confirmar que as mudanças em `use-dashboard.ts` foram salvas
- [ ] Verificar se há múltiplas instâncias de node
- [ ] Rodar `npm run dev` em novo terminal

### "Still 20+ API requests"
- [ ] Verificar se `debouncedFetchActivityData` está sendo usado
- [ ] Network tab filtrando por "/stats" ou "/activity"
- [ ] Confirmar debounce delay é 1500ms

### "localStorage ainda atualiza rapidamente"
- [ ] Verificar se localStorage debounce timeout é 2000ms
- [ ] Confirmar `storageTimeoutRef` está sendo usado
- [ ] Limpar localStorage e testar novamente

### "Tudo ok mas ainda está lento"
- [ ] Problemamais profundo (não é memory leak)
- [ ] Pode ser backend lento
- [ ] Pode ser query PostgreSQL cara
- [ ] Contatar dev

---

## 📞 Resultado

Após completar os testes, compartilhe:
- ✅ Quais testes passaram
- ❌ Quais testes falharam
- 📊 Screenshots de memory/network
- 🖥️ Timestamps dos testes

Isso ajudará a confirmar que o fix funcionou! 🎯

