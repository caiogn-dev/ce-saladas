# Lunch Break + Comportamento Fora do Horário — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar configuração de pausa para almoço ao `Store` e fazer o bot do ce-saladas bloquear apenas o fluxo de pedido quando fora do horário, mantendo conversa normal para outros intents.

**Architecture:** Campo `lunch_break` JSONField no `Store`; `is_open()` atualizado para checar a pausa; `_check_order_allowed()` helper no `PastaOrchestratorV2` chamado nos 5 handlers de pedido antes de processar.

**Tech Stack:** Django 4.x, Django ORM, `django.utils.timezone`, `pytest`/`django.test.TestCase`, docker-compose.

**Repo:** `server/` (`/home/graco/WORK/server`)

---

## File Map

| Ação | Arquivo |
|---|---|
| Modify | `apps/stores/models/base.py` |
| Create | `apps/stores/migrations/XXXX_add_lunch_break_to_store.py` (via `makemigrations`) |
| Modify | `apps/stores/admin.py` |
| Modify | `apps/automation/services/pastita_orchestrator_v2.py` |
| Create | `tests/test_store_lunch_break.py` |
| Create | `tests/test_orchestrator_out_of_hours.py` |

---

## Task 1: Campo `lunch_break` no modelo `Store`

**Files:**
- Modify: `apps/stores/models/base.py` (após linha com `operating_hours`)
- Create: migration via `makemigrations`
- Test: `tests/test_store_lunch_break.py`

- [ ] **Step 1: Criar o arquivo de teste com casos que falham**

Crie `server/tests/test_store_lunch_break.py`:

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from apps.stores.models import Store

User = get_user_model()


class StoreLunchBreakFieldTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testowner', email='test@example.com', password='pass'
        )
        self.store = Store.objects.create(
            name='Ce Saladas',
            slug='ce-saladas',
            store_type=Store.StoreType.FOOD,
            status=Store.StoreStatus.ACTIVE,
            owner=self.user,
            operating_hours={
                'monday': {'open': '10:00', 'close': '20:00'},
                'tuesday': {'open': '10:00', 'close': '20:00'},
                'wednesday': {'open': '10:00', 'close': '20:00'},
                'thursday': {'open': '10:00', 'close': '20:00'},
                'friday': {'open': '10:00', 'close': '20:00'},
                'saturday': {'open': '10:00', 'close': '20:00'},
            },
        )

    def test_lunch_break_default_is_empty_dict(self):
        store = Store.objects.get(pk=self.store.pk)
        self.assertEqual(store.lunch_break, {})

    def test_lunch_break_disabled_does_not_affect_is_open(self):
        self.store.lunch_break = {'enabled': False, 'start': '13:00', 'end': '14:00'}
        self.store.save()
        # 13:30 on a monday should still return open
        with patch('apps.stores.models.base.timezone') as mock_tz:
            mock_tz.now.return_value = self._make_datetime('monday', '13:30')
            self.assertTrue(self.store.is_open())

    def test_lunch_break_enabled_blocks_during_interval(self):
        self.store.lunch_break = {'enabled': True, 'start': '13:00', 'end': '14:00'}
        self.store.save()
        with patch('apps.stores.models.base.timezone') as mock_tz:
            mock_tz.now.return_value = self._make_datetime('monday', '13:30')
            self.assertFalse(self.store.is_open())

    def test_lunch_break_enabled_open_before_interval(self):
        self.store.lunch_break = {'enabled': True, 'start': '13:00', 'end': '14:00'}
        self.store.save()
        with patch('apps.stores.models.base.timezone') as mock_tz:
            mock_tz.now.return_value = self._make_datetime('monday', '12:59')
            self.assertTrue(self.store.is_open())

    def test_lunch_break_enabled_open_after_interval(self):
        self.store.lunch_break = {'enabled': True, 'start': '13:00', 'end': '14:00'}
        self.store.save()
        with patch('apps.stores.models.base.timezone') as mock_tz:
            mock_tz.now.return_value = self._make_datetime('monday', '14:01')
            self.assertTrue(self.store.is_open())

    def test_lunch_break_at_exact_start(self):
        self.store.lunch_break = {'enabled': True, 'start': '13:00', 'end': '14:00'}
        self.store.save()
        with patch('apps.stores.models.base.timezone') as mock_tz:
            mock_tz.now.return_value = self._make_datetime('monday', '13:00')
            self.assertFalse(self.store.is_open())

    def test_lunch_break_at_exact_end(self):
        self.store.lunch_break = {'enabled': True, 'start': '13:00', 'end': '14:00'}
        self.store.save()
        with patch('apps.stores.models.base.timezone') as mock_tz:
            mock_tz.now.return_value = self._make_datetime('monday', '14:00')
            self.assertFalse(self.store.is_open())

    def test_store_closed_day_unaffected_by_lunch_break(self):
        self.store.lunch_break = {'enabled': True, 'start': '13:00', 'end': '14:00'}
        self.store.save()
        with patch('apps.stores.models.base.timezone') as mock_tz:
            mock_tz.now.return_value = self._make_datetime('sunday', '11:00')
            self.assertFalse(self.store.is_open())

    @staticmethod
    def _make_datetime(weekday: str, time_str: str):
        """Return a naive datetime-like mock for a given weekday and HH:MM."""
        from datetime import datetime
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        # 2026-05-11 is a Monday
        base_date = datetime(2026, 5, 11)
        offset = days.index(weekday)
        from datetime import timedelta
        h, m = map(int, time_str.split(':'))
        dt = base_date + timedelta(days=offset, hours=h, minutes=m)
        dt.strftime = lambda fmt: {
            '%A': weekday.capitalize(),
            '%H:%M': time_str,
        }.get(fmt, '')
        return dt
```

- [ ] **Step 2: Rodar os testes — esperar FAIL**

```bash
docker-compose exec web python manage.py test tests.test_store_lunch_break -v 2
```

Esperado: erro de `AttributeError: 'Store' object has no attribute 'lunch_break'` ou falha na migration.

- [ ] **Step 3: Adicionar campo `lunch_break` ao `Store`**

Em `apps/stores/models/base.py`, logo após a linha do `operating_hours` (linha ~86):

```python
    # Operating Hours (JSON: {"monday": {"open": "09:00", "close": "18:00"}, ...})
    operating_hours = models.JSONField(default=dict, blank=True)

    # Lunch Break (JSON: {"enabled": true, "start": "13:00", "end": "14:00"})
    lunch_break = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"enabled": true, "start": "13:00", "end": "14:00"} — aplica a todos os dias abertos',
    )
```

- [ ] **Step 4: Gerar a migration**

```bash
docker-compose exec web python manage.py makemigrations stores --name add_lunch_break_to_store
```

Esperado: `Migrations for 'stores': apps/stores/migrations/XXXX_add_lunch_break_to_store.py`

- [ ] **Step 5: Rodar a migration**

```bash
docker-compose exec web python manage.py migrate stores
```

Esperado: `OK`

- [ ] **Step 6: Atualizar `Store.is_open()` com a checagem de lunch break**

Substitua o método `is_open()` em `apps/stores/models/base.py` (linha ~134):

```python
    def is_open(self):
        """Check if store is currently open based on operating hours and lunch break."""
        if not self.operating_hours:
            return True

        now = timezone.now()
        day_name = now.strftime('%A').lower()
        hours = self.operating_hours.get(day_name)

        if not hours:
            return False

        current_time = now.strftime('%H:%M')

        lb = self.lunch_break or {}
        if lb.get('enabled'):
            lb_start = lb.get('start', '13:00')
            lb_end = lb.get('end', '14:00')
            if lb_start <= current_time <= lb_end:
                return False

        return hours.get('open', '00:00') <= current_time <= hours.get('close', '23:59')
```

- [ ] **Step 7: Rodar testes — esperar PASS**

```bash
docker-compose exec web python manage.py test tests.test_store_lunch_break -v 2
```

Esperado: todos os 8 testes passam.

- [ ] **Step 8: Commit**

```bash
git add apps/stores/models/base.py apps/stores/migrations/ tests/test_store_lunch_break.py
git commit -m "feat: adiciona campo lunch_break ao Store e atualiza is_open()"
```

---

## Task 2: Admin — expor `lunch_break` no Django Admin

**Files:**
- Modify: `apps/stores/admin.py`

- [ ] **Step 1: Adicionar `lunch_break` ao fieldset `Operacao` em `StoreAdmin`**

Em `apps/stores/admin.py`, no `fieldset` `'Operacao'` (linha ~213), adicionar `'lunch_break'` após `'operating_hours'`:

```python
        ('Operacao', {
            'fields': (
                'currency', 'timezone', 'tax_rate',
                'delivery_enabled', 'pickup_enabled',
                'min_order_value', 'free_delivery_threshold', 'default_delivery_fee',
                'operating_hours',
                'lunch_break',
            )
        }),
```

- [ ] **Step 2: Garantir que `lunch_break` é inicializado no `save()` do form**

Em `StoreAdminForm.save()` (linha ~68), adicionar inicialização do `lunch_break` ao lado de `operating_hours`:

```python
    def save(self, commit=True):
        instance = super().save(commit=False)
        if instance.operating_hours is None:
            instance.operating_hours = {}
        if instance.lunch_break is None:
            instance.lunch_break = {}
        # ... resto inalterado ...
```

- [ ] **Step 3: Testar admin manualmente**

```bash
docker-compose exec web python manage.py check
```

Esperado: `System check identified no issues (0 silenced).`

Abrir o admin em `/admin/stores/store/<id>/change/` e verificar que o campo `lunch_break` aparece na seção "Operacao".

- [ ] **Step 4: Commit**

```bash
git add apps/stores/admin.py
git commit -m "feat: expõe lunch_break no admin de Store"
```

---

## Task 3: Guard `_check_order_allowed()` no `PastaOrchestratorV2`

**Files:**
- Modify: `apps/automation/services/pastita_orchestrator_v2.py`
- Create: `tests/test_orchestrator_out_of_hours.py`

- [ ] **Step 1: Criar testes que falham**

Crie `server/tests/test_orchestrator_out_of_hours.py`:

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock, PropertyMock
from apps.stores.models import Store
from apps.automation.services.pastita_orchestrator_v2 import PastaOrchestratorV2, OrchestratorResponse

User = get_user_model()


class OrchestratorOutOfHoursTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testowner2', email='test2@example.com', password='pass'
        )
        self.store = Store.objects.create(
            name='Ce Saladas',
            slug='ce-saladas-orch',
            store_type=Store.StoreType.FOOD,
            status=Store.StoreStatus.ACTIVE,
            owner=self.user,
            operating_hours={
                'monday': {'open': '10:00', 'close': '20:00'},
            },
            lunch_break={'enabled': True, 'start': '13:00', 'end': '14:00'},
        )
        self.conversation = MagicMock()
        self.conversation.phone_number = '+5511999999999'

    def _make_orchestrator(self):
        orch = PastaOrchestratorV2(conversation=self.conversation, store=self.store)
        return orch

    def test_check_order_allowed_returns_none_when_open(self):
        orch = self._make_orchestrator()
        with patch.object(self.store.__class__, 'is_open', return_value=True):
            result = orch._check_order_allowed()
        self.assertIsNone(result)

    def test_check_order_allowed_returns_response_when_closed(self):
        orch = self._make_orchestrator()
        with patch.object(self.store.__class__, 'is_open', return_value=False), \
             patch('apps.automation.services.pastita_orchestrator_v2.timezone') as mock_tz:
            mock_tz.localtime.return_value.strftime.return_value = '22:00'
            result = orch._check_order_allowed()
        self.assertIsInstance(result, OrchestratorResponse)
        self.assertIn('fora do horário', result.content)

    def test_check_order_allowed_lunch_break_message(self):
        orch = self._make_orchestrator()
        with patch.object(self.store.__class__, 'is_open', return_value=False), \
             patch('apps.automation.services.pastita_orchestrator_v2.timezone') as mock_tz:
            mock_tz.localtime.return_value.strftime.return_value = '13:30'
            result = orch._check_order_allowed()
        self.assertIsInstance(result, OrchestratorResponse)
        self.assertIn('almoço', result.content)
        self.assertIn('14:00', result.content)

    def test_add_to_cart_blocked_when_closed(self):
        orch = self._make_orchestrator()
        session = MagicMock()
        with patch.object(orch, '_check_order_allowed') as mock_check:
            mock_check.return_value = OrchestratorResponse(
                content='Fechado', source=MagicMock(), intent=MagicMock()
            )
            result = orch._handle_add_to_cart('quero uma salada', {}, session)
        self.assertEqual(result.content, 'Fechado')
        mock_check.assert_called_once()

    def test_create_order_blocked_when_closed(self):
        orch = self._make_orchestrator()
        session = MagicMock()
        with patch.object(orch, '_check_order_allowed') as mock_check:
            mock_check.return_value = OrchestratorResponse(
                content='Fechado', source=MagicMock(), intent=MagicMock()
            )
            result = orch._handle_create_order('finalizar', {}, session)
        self.assertEqual(result.content, 'Fechado')

    def test_delivery_method_blocked_when_closed(self):
        orch = self._make_orchestrator()
        session = MagicMock()
        with patch.object(orch, '_check_order_allowed') as mock_check:
            mock_check.return_value = OrchestratorResponse(
                content='Fechado', source=MagicMock(), intent=MagicMock()
            )
            result = orch._handle_delivery_method_selection('entrega', {}, session)
        self.assertEqual(result.content, 'Fechado')

    def test_address_input_blocked_when_closed(self):
        orch = self._make_orchestrator()
        session = MagicMock()
        with patch.object(orch, '_check_order_allowed') as mock_check:
            mock_check.return_value = OrchestratorResponse(
                content='Fechado', source=MagicMock(), intent=MagicMock()
            )
            result = orch._handle_address_input('Rua X', {}, session)
        self.assertEqual(result.content, 'Fechado')

    def test_payment_method_blocked_when_closed(self):
        orch = self._make_orchestrator()
        session = MagicMock()
        with patch.object(orch, '_check_order_allowed') as mock_check:
            mock_check.return_value = OrchestratorResponse(
                content='Fechado', source=MagicMock(), intent=MagicMock()
            )
            result = orch._handle_payment_method_selection('pix', {}, session)
        self.assertEqual(result.content, 'Fechado')

    def test_no_store_allows_order(self):
        orch = PastaOrchestratorV2(conversation=self.conversation, store=None)
        result = orch._check_order_allowed()
        self.assertIsNone(result)
```

- [ ] **Step 2: Rodar os testes — esperar FAIL**

```bash
docker-compose exec web python manage.py test tests.test_orchestrator_out_of_hours -v 2
```

Esperado: `AttributeError: 'PastaOrchestratorV2' object has no attribute '_check_order_allowed'`

- [ ] **Step 3: Adicionar `_check_order_allowed()` ao orchestrator**

Em `apps/automation/services/pastita_orchestrator_v2.py`, adicionar o método após `_fallback_response()` (linha ~919):

```python
    def _check_order_allowed(self) -> Optional['OrchestratorResponse']:
        """Retorna OrchestratorResponse de fechado se a loja não aceita pedidos agora, None se aceita."""
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
            try:
                order_url = self.store.automation_profile.get_order_url()
            except Exception:
                pass

        if order_url:
            msg += f"🔗 {order_url}"

        return OrchestratorResponse(
            content=msg,
            source=ResponseSource.AUTO,
            intent=IntentType.BUSINESS_HOURS,
        )
```

- [ ] **Step 4: Adicionar guard nos 5 handlers de pedido**

Em `apps/automation/services/pastita_orchestrator_v2.py`, no início de cada handler listado abaixo, inserir as duas primeiras linhas antes de qualquer lógica existente:

**`_handle_add_to_cart`** (linha ~396):
```python
    def _handle_add_to_cart(self, message: str, data: Dict, session) -> OrchestratorResponse:
        blocked = self._check_order_allowed()
        if blocked:
            return blocked
        # ... código existente inalterado ...
```

**`_handle_create_order`** (linha ~486):
```python
    def _handle_create_order(self, message: str, data: Dict, session) -> OrchestratorResponse:
        blocked = self._check_order_allowed()
        if blocked:
            return blocked
        # ... código existente inalterado ...
```

**`_handle_delivery_method_selection`** (linha ~505):
```python
    def _handle_delivery_method_selection(self, message: str, data: Dict, session) -> OrchestratorResponse:
        blocked = self._check_order_allowed()
        if blocked:
            return blocked
        # ... código existente inalterado ...
```

**`_handle_address_input`** (linha ~538):
```python
    def _handle_address_input(self, message: str, data: Dict, session) -> OrchestratorResponse:
        blocked = self._check_order_allowed()
        if blocked:
            return blocked
        # ... código existente inalterado ...
```

**`_handle_payment_method_selection`** (linha ~585):
```python
    def _handle_payment_method_selection(self, message: str, data: Dict, session) -> OrchestratorResponse:
        blocked = self._check_order_allowed()
        if blocked:
            return blocked
        # ... código existente inalterado ...
```

- [ ] **Step 5: Rodar testes — esperar PASS**

```bash
docker-compose exec web python manage.py test tests.test_orchestrator_out_of_hours -v 2
```

Esperado: todos os 9 testes passam.

- [ ] **Step 6: Rodar todos os testes do server**

```bash
docker-compose exec web python manage.py test tests -v 1
```

Esperado: nenhuma regressão.

- [ ] **Step 7: Commit**

```bash
git add apps/automation/services/pastita_orchestrator_v2.py tests/test_orchestrator_out_of_hours.py
git commit -m "feat: bloqueia fluxo de pedido fora do horário no PastaOrchestratorV2"
```

---

## Task 4: Configurar ce-saladas com lunch break

**Files:** (nenhum arquivo de código — apenas configuração de dados)

- [ ] **Step 1: Configurar via Django shell**

```bash
docker-compose exec web python manage.py shell
```

```python
from apps.stores.models import Store
s = Store.objects.get(slug='ce-saladas')
s.lunch_break = {'enabled': True, 'start': '13:00', 'end': '14:00'}
s.save(update_fields=['lunch_break'])
print(s.lunch_break)  # {'enabled': True, 'start': '13:00', 'end': '14:00'}
```

- [ ] **Step 2: Verificar via `is_open()` no horário de almoço**

No mesmo shell (execute às 13:xx ou mock):

```python
from django.utils import timezone
from unittest.mock import patch
from datetime import datetime

s = Store.objects.get(slug='ce-saladas')

# Teste manual
print('Horário atual — is_open:', s.is_open())
```

- [ ] **Step 3: Commit de configuração (opcional — só se houver fixture ou migration de dados)**

Se a configuração for feita via shell não há arquivo para commitar. Registrar no PR que o comando foi rodado em produção.

---

## Task 5: Teste de borda manual no bot

- [ ] **Step 1: Enviar mensagem de pedido durante o horário de almoço**

Simular ou aguardar 13:00. Enviar "quero pedir" pelo WhatsApp conectado ao ce-saladas.

Esperado: bot responde com "⏰ Estamos em pausa para o almoço até às 14:00..." + link do site.

- [ ] **Step 2: Enviar pergunta de cardápio durante o horário de almoço**

Enviar "qual o cardápio?" às 13:30.

Esperado: bot responde normalmente com o menu — **não** retorna mensagem de fechado.

- [ ] **Step 3: Enviar mensagem de pedido fora do horário (ex: 22h)**

Esperado: bot responde "🕐 No momento estamos fora do horário de atendimento..." + link.

- [ ] **Step 4: Enviar mensagem de pedido dentro do horário**

Esperado: fluxo normal de carrinho.

---

## Checklist Final

- [ ] `Store.lunch_break` com default `{}` não quebra nenhuma loja existente
- [ ] `is_open()` retorna `False` às 13:00 e `14:00`, `True` às `12:59` e `14:01`
- [ ] Bot responde perguntas de cardápio/horário normalmente fora do horário
- [ ] Bot bloqueia os 5 handlers de pedido fora do horário
- [ ] Mensagem de almoço menciona horário de retorno
- [ ] Mensagem de fora de horário inclui link do site
- [ ] Sem regressões nos testes existentes
