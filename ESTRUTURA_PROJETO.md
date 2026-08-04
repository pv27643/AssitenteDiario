# Site pessoal de organização — especificação técnica

Documento de referência para dar ao Claude Code começar a construir o projeto. Cobre stack, estrutura de pastas, modelo de dados e funcionalidades por módulo.

## 1. Stack

- **Frontend**: React + Vite + TypeScript
- **Estilos**: Tailwind CSS
- **Backend/dados**: Supabase (Postgres + Auth + Row Level Security)
- **Routing**: React Router
- **Autenticação**: nome de utilizador único + PIN de 6 dígitos (ver secção 7)
- **Notificações/automação** (opcional, fase 2): n8n, para lembretes por WhatsApp/email

## 2. Estrutura de pastas

Estrutura por módulo, não por tipo de ficheiro — cada secção do site é uma pasta independente com tudo o que precisa lá dentro. Adicionar ou remover um módulo não mexe no resto.

```
src/
  modules/
    gastos/
      components/
      hooks/
      types.ts
      routes.tsx
    tarefas/
      components/
      hooks/
      types.ts
      routes.tsx
    calendario/
      components/
      hooks/
      types.ts
      routes.tsx
    lembretes/          # módulo genérico — água, medicação, hábitos, etc.
      components/
      hooks/
      types.ts
      routes.tsx
  shared/
    components/          # botões, cards, inputs reutilizados por todos os módulos
    lib/
      supabase.ts         # cliente Supabase
    hooks/
  modules.config.ts       # regista os módulos ativos (nome, ícone, rota) — adicionar
                           # um módulo novo ao site é só acrescentar uma entrada aqui
  App.tsx
  main.tsx
supabase/
  migrations/
    0001_init.sql
.env.local                # SUPABASE_URL, SUPABASE_ANON_KEY
```

## 3. Modelo de dados (Supabase / Postgres)

```sql
-- gastos
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category text not null,          -- 'alimentacao' | 'gasolina' | 'casa' | 'lazer' | 'outros'
  amount numeric not null,
  description text,
  spent_at date not null default current_date,
  created_at timestamptz default now()
);

-- tarefas
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  priority text default 'media',   -- 'baixa' | 'media' | 'alta'
  status text default 'por_fazer', -- 'por_fazer' | 'em_curso' | 'feito'
  due_date date,
  created_at timestamptz default now()
);

-- eventos de calendário
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  event_date date not null,
  event_time time,
  linked_task_id uuid references tasks(id),
  created_at timestamptz default now()
);

-- perfil do utilizador (login por nome de utilizador + PIN)
create table profiles (
  id uuid primary key references auth.users not null,
  username text unique not null,
  pin_hash text not null,          -- hash do PIN, nunca guardar em texto simples
  created_at timestamptz default now()
);

-- tipos de lembrete/hábito — o utilizador cria os que quiser (água, medicação, exercício...)
create table reminder_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,              -- 'Água', 'Vitamina D', 'Caminhada'...
  unit text default 'vez',         -- 'copos', 'comprimidos', 'vezes'...
  daily_goal int,                  -- opcional
  interval_hours int,              -- de quanto em quanto tempo lembrar (opcional)
  color text default 'teal',
  active boolean default true,
  created_at timestamptz default now()
);

-- cada registo de um lembrete (independente do tipo)
create table reminder_logs (
  id uuid primary key default gen_random_uuid(),
  reminder_type_id uuid references reminder_types(id) not null,
  user_id uuid references auth.users not null,
  logged_at timestamptz default now(),
  note text                        -- opcional: dose, observação, etc.
);
```

Ativar Row Level Security em todas as tabelas, com política `user_id = auth.uid()` para leitura e escrita — cada um só vê os seus dados.

## 4. Rotas

| Rota | Página | Conteúdo |
|---|---|---|
| `/` | Dashboard | resumo do dia: próximas tarefas, gasto do mês, próximos eventos, lembretes ativos |
| `/gastos` | Gastos | lista de despesas, barras por categoria, formulário de adicionar |
| `/tarefas` | Tarefas | lista/kanban, filtros por prioridade e estado |
| `/calendario` | Calendário | vista mensal/semanal, eventos ligados a tarefas com prazo |
| `/lembretes` | Lembretes | gerir os teus tipos de lembrete (criar, editar, desativar) e ver histórico |
| `/login` | Login | autenticação por nome de utilizador + PIN |

Cada lembrete ativo aparece também como widget automático no Dashboard — não precisas de rota própria por tipo.

## 5. Funcionalidades por módulo

**Dashboard**
- Resumo do dia (tarefas de hoje, gasto do mês até agora, eventos próximos)
- Um widget por cada lembrete ativo, gerado automaticamente a partir da configuração

**Gastos**
- Adicionar despesa (categoria, valor, data, descrição opcional)
- Barras de percentagem por categoria, ordenadas por valor
- Filtro por mês
- Total gasto e comparação com o mês anterior (fase 2)

**Tarefas**
- CRUD de tarefas (título, prioridade, prazo, estado)
- Filtros por prioridade/estado
- Ligação opcional a um evento no calendário

**Calendário**
- Vista mensal com eventos
- Eventos herdados de tarefas com prazo (mesma fonte de dados, sem duplicar)

**Lembretes (módulo genérico)**
- Criar um novo tipo de lembrete com nome, unidade, meta diária e intervalo (ex: Água, Medicação, Exercício) — sem escrever código novo para cada um
- Um único componente de widget lê a configuração de cada tipo e desenha-se sozinho (ícone, cor, meta, botão de registo rápido)
- Registo rápido ("+1") e ajuste do intervalo por tipo, com histórico completo por tipo
- Editar ou desativar um tipo sem apagar o histórico já registado
- Fase 2: notificação real via browser Notifications API ou webhook n8n

## 6. MVP vs. Fase 2

**MVP** (primeira semana): Auth + Tarefas + Gastos, sem notificações reais, sem calendário.
**Fase 2**: Calendário ligado a tarefas, módulo de lembretes com widgets persistentes, notificações reais.
**Fase 3**: automações n8n (lembretes por WhatsApp/email), resumo semanal automático.

## 7. Autenticação — utilizador + PIN

O Supabase Auth é pensado para email/password, por isso um login por nome de utilizador + PIN de 6 dígitos precisa de um pequeno truque. Duas formas de o fazer, da mais simples à mais robusta:

1. **Email sintético** (mais rápido a implementar): no registo, cria a conta Supabase com `username@interno.local` como email e o PIN como password. No login, o utilizador só vê os campos "utilizador" e "PIN" — o email sintético é montado por trás sem ele saber.
2. **Edge Function dedicada** (mais correto): guarda `username` + `pin_hash` (hash, nunca texto simples) na tabela `profiles`, e uma Edge Function verifica o PIN e emite uma sessão através da Admin API do Supabase.

Nota: um PIN de 6 dígitos só tem um milhão de combinações possíveis — aceitável para uso pessoal, mas vale a pena limitar tentativas falhadas (ex: bloquear por alguns minutos ao fim de 5 erros) para não ficar aberto a tentativa e erro.

## 8. Como usar com o Claude Code

Guarda este ficheiro em `docs/ESTRUTURA_PROJETO.md` na raiz do repositório antes de começares. Depois pede ao Claude Code para: 1) fazer o scaffold do projeto Vite+React+TS+Tailwind, 2) criar as migrations Supabase a partir da secção 3, 3) construir os módulos por ordem do MVP na secção 6.

## 9. Design e responsividade (uso principal: browser do telemóvel)

O site é para usar sobretudo no browser do telemóvel, por isso o design é mobile-first: começa pelo layout de ecrã pequeno e só depois adaptas para ecrãs largos, nunca ao contrário.

- **Navegação**: em ecrã estreito, barra de separadores fixa em baixo (ícone + texto curto), gerada a partir de `modules.config.ts`. A partir do breakpoint `md`, essa barra dá lugar a uma sidebar lateral. É a mesma configuração a alimentar as duas.
- **Layout**: uma coluna por defeito; grelhas de 2+ colunas só a partir de `md:`.
- **Toque**: alvos de toque com pelo menos 44px de altura (botões, itens de lista); nada de elementos pequenos demais para o dedo.
- **Espaço seguro**: usa `env(safe-area-inset-bottom)` no padding da barra de navegação, para não ficar por baixo da barra de gestos do telemóvel.

**Paleta de cor**: base em preto, cinza e branco, com vermelho como única cor de destaque.

- Fundo: preto/cinza muito escuro (`bg-black` ou `bg-zinc-950`)
- Superfícies (cards, inputs): `bg-zinc-900`, borda `border-zinc-800`
- Texto principal: branco (`text-white` / `text-zinc-100`)
- Texto secundário: cinza (`text-zinc-400` / `text-zinc-500`)
- Vermelho (`red-500`/`red-600`): reservado para o que precisa de atenção — ação principal, item ativo na navegação, alerta de orçamento ultrapassado. Não uses vermelho decorativamente.
- Nas categorias de gastos, em vez de uma cor por categoria (esquema antigo), usa tons de cinza para as distinguir e deixa o vermelho só para sinalizar quando uma categoria passa do orçamento definido.
