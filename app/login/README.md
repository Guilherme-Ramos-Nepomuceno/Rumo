# 🔐 Módulo Acesso (Login)

O módulo **Login** gerencia o portão de entrada do Rumo, garantindo que o usuário seja persistido durante a sessão do navegador.

---

## 🛠️ Especificações Técnicas

A autenticação é propositalmente leve, utilizando um sistema de **Token Fake** armazenado no `localStorage`.

### Fluxo de Autenticação

1. O componente de Login solicita as credenciais (Mock).
2. Na aprovação, um `auth_token` é gerado e injetado no armazenamento local.
3. O `RootPage` (/) detecta a presença desse token no `useEffect` e redireciona automaticamente para o Dashboard (`/home`).

---

## 📋 Regras de Negócio (Acesso)

- **Sessão Persistente**: A saída só ocorre explicitamente através do comando `logout`, que remove o token e limpa os dados da sessão.
- **Onboarding Automático**: Se o token estiver ausente, qualquer tentativa de acessar `/home` ou `/historico` redireciona o usuário para o `/login`.

---

## 🔌 API & Eventos Internos

O login interage diretamente com o roteador do Next.js:

| Trigger | Efeito | Observação |
|---------|--------|------------|
| `router.push("/home")` | Redirecionamento após login | Ocorre se `auth_token` for válido. |
| `router.push("/login")` | Redirecionamento de proteção | Bloqueia o acesso sem token. |

---

### Exemplo de Guard (Interno)

```typescript
useEffect(() => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    router.push("/home")
  } else {
    router.push("/login")
  }
}, [router])
```

---
© 2026 Rumo Project.
