# Design: Pausa para Almoço + Comportamento Fora do Horário (ce-saladas)

**Data:** 2026-05-14  
**Escopo:** `apps/stores/models/base.py`, `apps/automation/services/pastita_orchestrator_v2.py`  
**Prioridade:** Urgente

---

## Contexto

O ce-saladas tem duas lacunas no comportamento do bot WhatsApp:

1. **Não existe configuração de pausa para almoço** (13:00–14:00) — o `Store.operating_hours` só guarda `open`/`close` por dia, sem conceito de intervalo.
2. **Fora do horário, o bot bloqueia tudo** via `OUT_OF_HOURS` na `automation_service.py`, mas o `pastita_orchestrator_v2.py` não tem nenhum gate — processa pedidos 24h. O comportamento correto é: fora do horário o bot continua conversando (cardápio, dúvidas, horários), mas quando o cliente tenta fazer um **pedido**, informa que está fechado e redireciona para agendamento pelo site.

---

## Modelo de Dados

### Novo campo: `Store.lunch_break`

**Arquivo:** `apps/stores/models/base.py`

```python
lunch_break = models.JSONField(
    default=dict,
    blank=True,
    help_text='{"enabled": true, "start": "13:00", "end": "14:00"}'
)
```

- Aplica a **todos os dias abertos** (configuração global, não por-dia)
- Default `{}` = lunch break desabilitado — sem quebra no comportamento atual
- Requer 1 migration

**Migration:** `apps/stores/migrations/XXXX_add_lunch_break_to_store.py`

### Atualização: `Store.is_open()`

Após a checagem existente de `open`/`close`, adicionar verificação do lunch break:

```python
def is_open(self):
    if not self.operating_hours:
        return True

    now = timezone.now()
    day_name = now.strftime('%A').lower()
    hours = self.operating_hours.get(day_name)

    if not hours:
        return False

    current_time = now.strftime('%H:%M')

    # Checa lunch break antes de confirmar abertura
    lb = self.lunch_break or {}
    if lb.get('enabled'):
        lb_start = lb.get('start', '13:00')
        lb_end   = lb.get('end',   '14:00')
        if lb_start <= current_time <= lb_end:
            return False

    return hours.get('open', '00:00') <= current_time <= hours.get('close', '23:59')
```

---

## Comportamento do Bot Fora do Horário

### Regra

| Situação | Comportamento |
|---|---|
| Dentro do horário normal | Tudo normal — fluxo completo |
| 13:00–14:00 (lunch break ativo) + qualquer mensagem que não seja pedido | Responde normalmente |
| 13:00–14:00 (lunch break ativo) + intent de pedido | Avisa pausa + link do site |
| Fora do horário (ex: 22h) + qualquer mensagem que não seja pedido | Responde normalmente |
| Fora do horário + intent de pedido | Avisa fechado + link do site |

**Intents bloqueados fora do horário:** `ADD_TO_CART`, `CREATE_ORDER`, `DELIVERY_METHOD`, e qualquer handler que avance o fluxo de pedido.

**Intents que continuam funcionando:** `MENU`, `BUSINESS_HOURS`, `DELIVERY_INFO`, `GREETING`, `HUMAN_HANDOFF`, `UNKNOWN`/fallback.

### Implementação

**Arquivo:** `apps/automation/services/pastita_orchestrator_v2.py`

#### Novo método helper `_check_order_allowed()`

```python
def _check_order_allowed(self) -> Optional[OrchestratorResponse]:
    """Retorna resposta de fechado se loja não está aberta para pedidos, None caso contrário."""
    if not self.store or self.store.is_open():
        return None

    now = timezone.localtime()
    current_time = now.strftime('%H:%M')
    lb = self.store.lunch_break or {}

    if lb.get('enabled') and lb.get('start', '') <= current_time <= lb.get('end', ''):
        lb_end = lb.get('end', '14:00')
        msg = (
            f"⏰ Estamos em pausa para o almoço até às *{lb_end}*.\n\n"
            "Mas você pode agendar seu pedido pelo nosso site "
            "e ele entra na fila assim que voltarmos! 😊\n\n"
        )
    else:
        msg = (
            "🕐 No momento estamos *fora do horário de atendimento*.\n\n"
            "Mas você pode agendar seu pedido para quando abrirmos:\n"
        )

    order_url = None
    if hasattr(self.store, 'automation_profile'):
        order_url = self.store.automation_profile.get_order_url()

    if order_url:
        msg += f"🔗 {order_url}"

    return OrchestratorResponse(
        content=msg,
        source=ResponseSource.AUTO,
        intent=IntentType.BUSINESS_HOURS,
    )
```

#### Uso nos handlers de pedido

```python
def _handle_add_to_cart(self, message, data, session):
    blocked = self._check_order_allowed()
    if blocked:
        return blocked
    # ... lógica existente ...

def _handle_create_order(self, message, data, session):
    blocked = self._check_order_allowed()
    if blocked:
        return blocked
    # ... lógica existente ...

def _handle_delivery_method_selection(self, message, data, session):
    blocked = self._check_order_allowed()
    if blocked:
        return blocked
    # ... lógica existente ...
```

---

## Admin / Config

- Expor `lunch_break` no Django Admin de `Store` (inline JSONField ou campos separados `lunch_break_enabled`, `lunch_break_start`, `lunch_break_end` via `readonly_fields` / form customizado)
- Configuração inicial para o ce-saladas via shell ou admin: `{"enabled": true, "start": "13:00", "end": "14:00"}`

---

## Fluxo de Implementação

1. Migration — adicionar `lunch_break` ao `Store`
2. Atualizar `Store.is_open()` com verificação de lunch break
3. Adicionar `_check_order_allowed()` ao `PastaOrchestratorV2`
4. Adicionar o guard nos 3 handlers de pedido
5. Expor no admin
6. Configurar ce-saladas via admin/shell
7. Testar manualmente nos horários de borda (12:59, 13:00, 14:00, 14:01)

---

## O que NÃO muda

- Fluxo de pedido dentro do horário: inalterado
- `automation_service.py` e seu `OUT_OF_HOURS`: inalterado (é outro fluxo)
- `CompanyProfile.business_hours`: não é tocado
- Todos os outros intents continuam funcionando fora do horário
