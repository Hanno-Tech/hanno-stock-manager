# Asaas na prática

> Referência de integração escrita depois de subir uma assinatura recorrente com cartão
> em produção (agosto de 2026, API v3). Aqui está o que **só se descobre implementando**:
> os campos que a documentação não mostra, as regras que derrubam a integração em silêncio
> e as decisões de arquitetura que evitam retrabalho.
>
> Versão navegável: [Asaas na Prática](https://claude.ai/code/artifact/1660387d-a692-40ca-8e20-6a393c4d9f6b)

---

## As armadilhas, em uma tela

Cada linha custou tempo de depuração. Se ler só esta seção, já evita a maior parte do prejuízo.

| Armadilha | O que acontece |
|---|---|
| **`$` no .env** | A chave começa com `$` e o Next expande `$VAR` dentro de `.env`. Sem escapar (`\$aact_…`) ela chega **vazia**, e o erro é *"chave de API inválida"* — que parece chave errada. |
| **Só HTTP 200** | O Asaas considera sucesso **apenas** 200. Qualquer 201, 204, 400 ou 500 vira retentativa, e 15 seguidas **pausam a fila inteira** de webhooks. |
| **`externalReference` some** | O que você põe no checkout **não** chega na cobrança gerada — ela vem com `null`. Use `payment.checkoutSession`. |
| **Sem GET de checkout** | `GET /v3/checkouts/{id}` devolve **404**. Guarde o id no seu banco ao criar, ou perde o vínculo. |
| **Callback público** | O checkout recusa `localhost` nas URLs de retorno. Em dev, só com túnel. |
| **`imageBase64`** | `items[].imageBase64` é **obrigatório** no checkout. |
| **Cartão renova, PIX não** | Só assinatura com cartão tokenizado cobra sozinha. Com PIX/boleto o Asaas apenas *gera* a fatura. |
| **CNPJ tem letras** | Desde 31/07/2026 o CNPJ é alfanumérico. Validador só-dígito reprova toda empresa nova. |
| **reCAPTCHA** | A página de checkout tem reCAPTCHA — pagamento de teste é manual, não automatizável. |

---

## Ambiente e autenticação

| Ambiente | Base URL | Prefixo da chave |
|---|---|---|
| Produção | `https://api.asaas.com/v3` | `$aact_prod_` |
| Sandbox | `https://api-sandbox.asaas.com/v3` | `$aact_hmlg_` |

A chave vai no header **`access_token`** — não é `Authorization`, não é `Bearer`. O
**`User-Agent` é obrigatório** para contas criadas depois de 13/06/2024.

### Derive o ambiente do prefixo

Não use variável separada de ambiente: o prefixo já diz tudo, e assim é impossível apontar
a chave de produção para o sandbox por engano de config — erro que só aparece quando
alguém não é cobrado.

```js
function baseUrl(key) {
  if (key.startsWith('$aact_prod_')) return 'https://api.asaas.com/v3';
  if (key.startsWith('$aact_hmlg_')) return 'https://api-sandbox.asaas.com/v3';
  throw new Error('chave sem prefixo reconhecido');
}
```

> Chaves antigas, emitidas antes dessa padronização, não têm prefixo. Deixe uma variável de
> escape opcional (`ASAAS_ENV`) com prioridade quando definida.

### O cifrão no arquivo .env

Primeira pedra do caminho, e ela mente. Carregadores de `.env` que fazem expansão de
variável — o do Next entre eles — tentam resolver `$aact_hmlg_000Mzk…` como variável.

```bash
ASAAS_API_KEY="$aact_hmlg_000Mzk…"    # ✗ chega vazia
ASAAS_API_KEY="\$aact_hmlg_000Mzk…"   # ✓ correta
```

Sintoma: `401 invalid_access_token`, descrição *"A chave de API fornecida é inválida"* — que
leva você a conferir a chave, que está certa. Em painéis de variáveis (Vercel e afins) não
há expansão: ali vai **sem** escape.

---

## Clientes e CPF/CNPJ

`POST /v3/customers` — obrigatórios apenas `name` e `cpfCnpj`. Todo o resto é opcional.

Mande sempre `externalReference` com o id do usuário no seu sistema. Depois,
`GET /v3/customers?externalReference=<id>` recupera o cliente e evita duplicar quando uma
tentativa falha no meio.

> **Consequência de produto:** como o documento é obrigatório, **seu cadastro precisa pedir
> CPF/CNPJ**. Se o fluxo atual não pede, isso é mudança de formulário, schema e validação —
> planeje antes de estimar a integração.

### CNPJ alfanumérico

Desde **31/07/2026** as 12 primeiras posições aceitam letras; só os dois dígitos
verificadores continuam numéricos. O módulo 11 é o de sempre — o que mudou é o valor de
cada caractere, agora `ASCII − 48` (`"0"`→0, `"9"`→9, `"A"`→17, `"Z"`→42).

Exemplo oficial da Receita para testar: `12.ABC.345/01DE-35`.

```js
const valorDe = (c) => c.charCodeAt(0) - 48;
const PESOS_CNPJ = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function digito(doc, pesos) {
  const soma = pesos.reduce((a, p, i) => a + valorDe(doc[i]) * p, 0);
  const resto = 11 - (soma % 11);
  return resto >= 10 ? 0 : resto;
}

function isValidCnpj(doc) {            // doc já normalizado: [0-9A-Z]
  if (!/^[0-9A-Z]{12}\d{2}$/.test(doc)) return false;
  if (/^(.)\1{13}$/.test(doc)) return false;
  const dv1 = digito(doc, PESOS_CNPJ.slice(1));
  const dv2 = digito(doc, PESOS_CNPJ);
  return doc.slice(12) === `${dv1}${dv2}`;
}
```

Normalize com `value.toUpperCase().replace(/[^0-9A-Z]/g, '')` antes de validar e gravar.
Máscara é assunto de tela. Para CPF, os pesos são `[11,10,…,2]` e a mesma regra de módulo 11.

---

## Assinaturas

| Operação | Endpoint | Notas |
|---|---|---|
| Criar | `POST /v3/subscriptions` | `customer`, `billingType`, `value`, `nextDueDate`, `cycle` |
| Alterar | `PUT /v3/subscriptions/{id}` | `updatePendingPayments: true` para valer na fatura já aberta |
| Cancelar | `DELETE /v3/subscriptions/{id}` | Apaga pendentes e vencidas; mantém as pagas |
| Cobranças | `GET /v3/subscriptions/{id}/payments` | A fonte de verdade do estado |
| Trocar cartão | `PUT /v3/subscriptions/{id}/creditCard` | Exige cartão cru ou `creditCardToken`, mais `remoteIp` |

`billingType`: `BOLETO`, `CREDIT_CARD`, `PIX`, `UNDEFINED`.
`cycle`: `WEEKLY` … `YEARLY`.

### A distinção que decide o produto

**Gerar cobrança é automático. Debitar não.**

Com boleto, PIX ou `UNDEFINED`, o Asaas cria a fatura do próximo ciclo sozinho e notifica o
cliente — mas o dinheiro só entra quando ele paga, todo mês, na mão. Renovação automática de
verdade só existe com **cartão tokenizado**.

Decida isso antes de desenhar as telas: muda o fluxo de cobrança, o tratamento de recusa e a
expectativa de retenção.

### Quando a próxima cobrança nasce

Por padrão o Asaas gera a cobrança **40 dias antes** do vencimento (ajustável para 14 ou 7
mediante configuração da conta). Duas consequências:

- Quando o acesso pago de um mês expira, a fatura do mês seguinte **já existe** — não há
  janela de "fatura sendo gerada".
- Frequentemente haverá **duas cobranças em aberto ao mesmo tempo**. Ao escolher qual
  mostrar, pegue a de vencimento mais próximo.

### Estado derivado, nunca inventado

Não mantenha o estado da assinatura por eventos isolados. Leia
`/subscriptions/{id}/payments` e derive tudo dali — assim evento perdido, duplicado ou fora
de ordem não deixa o estado torto.

---

## Checkout hospedado

Se precisa de cartão e não quer o número passando pelo seu servidor:
`POST /v3/checkouts`. Devolve um `link` para uma página do Asaas que coleta cartão e
endereço e, no fim, cria a assinatura recorrente.

```json
{
  "billingTypes": ["CREDIT_CARD"],
  "chargeTypes":  ["RECURRENT"],
  "minutesToExpire": 60,
  "externalReference": "<id do usuário>",
  "callback": {
    "successUrl": "https://seu-app.com/assinatura?checkout=ok",
    "cancelUrl":  "https://seu-app.com/assinatura?checkout=cancelado",
    "expiredUrl": "https://seu-app.com/assinatura?checkout=expirado"
  },
  "items": [{
    "name": "Plano mensal",
    "quantity": 1,
    "value": 19.90,
    "imageBase64": "<obrigatório>"
  }],
  "subscription": { "cycle": "MONTHLY", "nextDueDate": "2026-08-21" }
}
```

Resposta: `id`, `link`, `status`.

### Três recusas que você vai levar

1. **`localhost` nos callbacks.** Erro literal: *"O campo successUrl é inválido"*. Precisa
   ser URL pública — em dev, um túnel.
2. **`imageBase64` ausente.** Obrigatório em cada item. Leia um PNG do próprio projeto e
   cacheie em memória.
3. **`customerData` incompleto.** O objeto é opcional, mas se você mandar ele exige
   `phoneNumber`, `address`, `addressNumber`, `province` e `postalCode`. Se o seu cadastro
   não coleta endereço, **omita o objeto inteiro** e deixe a página do Asaas coletar.

### Não existe consulta de checkout

`GET /v3/checkouts/{id}` devolve **404**. Não há como perguntar depois "o que aconteceu com
aquele checkout". Grave o `id` no seu banco no instante da criação — é a sua única âncora.

### Trocar cartão fica áspero

O checkout hospedado não devolve token de cartão para você, e
`PUT /v3/subscriptions/{id}/creditCard` exige token ou cartão cru. Então "trocar cartão"
vira **cancelar a assinatura e abrir um checkout novo**. Conte com isso no desenho da tela e
preserve o acesso já pago durante a troca.

---

## O elo perdido entre pagamento e conta

O erro mais caro do checkout hospedado, porque **não parece um erro**: o webhook responde
200, o painel do Asaas fica verde, e o cliente que pagou continua travado no seu app.

Na **primeira** cobrança de uma assinatura criada pelo checkout, os três caminhos óbvios
para achar a conta estão vazios ao mesmo tempo:

| Campo do evento | Situação |
|---|---|
| `payment.subscription` | Existe no Asaas, mas seu banco ainda não conhece esse id — quem criou a assinatura foi o checkout |
| `payment.customer` | Mesma coisa: o cliente também nasceu no checkout |
| `payment.externalReference` | **`null`** — o que você pôs no checkout não se propaga para a cobrança |

A saída está no mesmo payload, num campo que a documentação não destaca:

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "subscription":      "sub_p1mgrt366xisgli1",
    "customer":          "cus_000195426529",
    "externalReference": null,                 // ← inútil
    "checkoutSession":   "de78327c-156c-…"     // ← o elo
  }
}
```

`payment.checkoutSession` é o `id` do checkout que você criou e guardou.

**Ordem de busca que funciona:**

1. `payment.subscription` → sua coluna de id de assinatura (renovações)
2. `payment.checkoutSession` → sua coluna de id de checkout (**primeira cobrança**)
3. `payment.customer` → sua coluna de id de cliente (rede de segurança)

Quando a conta for achada pelo checkout, **adote a assinatura ali mesmo** com os ids que o
próprio evento entrega: grave `subscription` e `customer`, limpe o `checkoutId`, e só então
leia o estado das cobranças. Se tentar ler o estado antes de gravar o id, não há o que
consultar e o pagamento passa batido.

> **Sintoma:** webhook 200, evento registrado, nenhum efeito. Se a sua rota "não achou a
> conta" e responde 200 silenciosamente, você nunca descobre pelo painel. **Registre em log
> todo evento que chegou e não encontrou dono.**

---

## Webhooks

### Autenticação

Você define um `authToken` ao criar o webhook (32 a 255 caracteres, sem espaços; o Asaas
recusa sequências simples). Ele chega em cada requisição no header **`asaas-access-token`**.
O valor **só é exibido no momento da criação** — guarde na hora.

Compare em tempo constante: é credencial, não identificador. E responda o **mesmo código**
para token ausente e token errado — um 503 para "não configurado" conta a quem sonda que a
integração existe e está incompleta.

### A regra que derruba filas

O Asaas reconhece **apenas HTTP 200** como sucesso. Qualquer outra resposta — inclusive 201,
204, 308, 400, 403, 404 e 500 — dispara retentativa. Depois de **15 falhas consecutivas** a
fila daquele webhook é interrompida e nada mais é entregue.

### Só devolva erro no que a retentativa resolve

Consequência de desenho pouco óbvia: **payload que você não entende deve responder 200**,
não 400. Reenviar não conserta um corpo que o seu schema rejeita, e 15 deles derrubam junto
todos os eventos que importam. Registre em log e siga.

Erro legítimo é só o que muda numa retentativa: token inválido (401) e falha sua ao
processar (500).

### Idempotência

A entrega é *at least once*: o mesmo evento chega mais de uma vez. Cada evento tem `id`
único (`evt_…`) — use como chave primária de uma tabela e o segundo POST bate no unique.

**A ordem certa:** grave o id do evento e a mudança de estado na **mesma transação**, e faça
a leitura na API do Asaas **antes** dela. Assim uma falha deixa o evento não processado e a
retentativa resolve — ao contrário de "gravou o id, respondeu 200 e depois quebrou", que
perde o evento para sempre.

### Quando a fila pausa

Em **Integrações → Webhooks** os logs mostram código HTTP, mensagem, horário, payload e
número de tentativas de cada entrega. É o primeiro lugar a olhar.

Para religar: pelo painel, ou `PUT /v3/webhooks/{id}` com `{"interrupted": false}`. Os
eventos acumulados são reenviados na ordem original — **mas são descartados depois de 14
dias** de fila parada. Corrija a causa antes de religar, senão ela pausa de novo em 15
tentativas.

### Eventos que interessam

| Evento | Significado |
|---|---|
| `CHECKOUT_PAID` | Checkout concluído — momento de ligar a assinatura à conta |
| `PAYMENT_CONFIRMED` | Pagamento processado; saldo ainda não disponível. **É o que libera acesso.** |
| `PAYMENT_RECEIVED` | Saldo disponível na conta Asaas. No cartão, demora até a data de crédito |
| `PAYMENT_OVERDUE` | Cobrança vencida |
| `PAYMENT_REFUNDED` | Estornada — revogue o acesso |
| `PAYMENT_CHARGEBACK_REQUESTED` | Chargeback recebido |
| `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED` | Recusa na renovação — todo SaaS de cartão precisa tratar |
| `SUBSCRIPTION_DELETED` | Assinatura encerrada |

> **Custou caro:** confira a URL cadastrada **caractere por caractere**. Um domínio parecido
> (`meu-app.vercel.app` em vez de `meu-app-ruby.vercel.app`) devolve 404 de outro projeto
> qualquer, e em 15 eventos a fila morre.

---

## Testar no sandbox

Contas, dados e chaves são completamente separados entre sandbox e produção. Crie a sua em
`sandbox.asaas.com`.

### Cartões de teste

| Número | Resultado |
|---|---|
| `4444 4444 4444 4444` | Aprova. Validade futura qualquer, CVV de 3 dígitos |
| `5184019740373151` | Recusa (Mastercard) |
| `4916561358240741` | Recusa (Visa) |

### Dar baixa sem cartão

`POST /v3/payments/{id}/receiveInCash` com `paymentDate`, `value` e `notifyCustomer` marca a
cobrança como `RECEIVED_IN_CASH`. É a forma mais rápida de exercitar o caminho de "dinheiro
entrou" sem passar por navegador.

### O que não dá para automatizar

- A página de checkout tem **reCAPTCHA**: pagamento de teste é manual.
- **Webhooks precisam de URL pública.** Ou túnel, ou ambiente de preview.
- PIX no sandbox exige **duas contas** (pagadora e recebedora) via `POST /v3/pix/qrCodes/pay`.

### O que compensa construir

Um script de desenvolvimento com quatro comandos — ver fatura, dar baixa, disparar webhook
local, forçar vencimento — paga o próprio custo no primeiro dia. Trave-o para **recusar
chave que não seja de sandbox**: dar baixa numa cobrança real é liberar acesso sem dinheiro
ter entrado.

Neste repo: [`scripts/asaas-sandbox.mjs`](../scripts/asaas-sandbox.mjs).

---

## Decisões que valeram

### Guarde uma data, não um booleano

O portão de acesso deve consultar `paidThrough` — data até quando o acesso está pago — e não
um campo "está pago?". Assim o mês seguinte expira sozinho mesmo que nenhum webhook chegue.
Um booleano depende de alguém lembrar de desligá-lo.

Calcule a partir do **vencimento** da cobrança paga, não da data do pagamento:
`vencimento + ciclo + folga`. Quem paga adiantado não perde os dias que adiantou; quem paga
atrasado não ganha um mês extra por ter demorado. A folga de alguns dias evita travar o
cliente exatamente no dia do vencimento seguinte.

### Não crie a assinatura antes de precisar

Se o produto tem teste grátis, não abra a assinatura no cadastro — abra quando o teste
acabar e a pessoa decidir assinar. Efeito colateral desejável: quem testou e não voltou
**nunca recebe cobrança**.

### O portão vive na consulta, não no proxy

A decisão depende do banco. Middleware roda em toda requisição e normalmente só tem o token
de sessão na mão. Ponha o portão na função que já carrega o usuário.

### Preserve quem já usava

Ao introduzir cobrança num produto que já tem usuários, deixe um campo nulo identificar
"conta anterior à cobrança" e trate como acesso liberado. A migration não pode trancar quem
já estava operando.

### Erro nunca conta o que falta na configuração

Mensagens como *"ASAAS_API_KEY ausente"*, *"defina APP_URL"* ou a descrição crua do gateway
(*"a chave de API fornecida é inválida"*) não podem chegar à tela do cliente. Sanitize **na
origem**: quem conhece o detalhe registra no log e devolve mensagem genérica.

```js
// Erro já pronto para a tela; o detalhe fica no log.
function falha(detalhe, status) {
  console.error('[asaas]', detalhe);
  return new AsaasError(GENERICA, status, true /* publico */);
}
```

Se algum erro do gateway *for* útil ao cliente, marque-o explicitamente como público. Padrão
negado: erro novo só chega à tela se alguém disser que pode.

---

## Armadilhas do Next.js

### Nunca redirecione para fora a partir de uma Server Action

`redirect()` aceita URL externa e a documentação diz que funciona. O que ela não conta é
*como*: o App Router transforma isso numa navegação de página inteira disparada de dentro do
render (`location.assign`) e então **suspende para sempre**. No código do próprio Next há um
`// TODO-APP` admitindo que falha de navegação não é tratada.

Se o navegador não executar essa navegação — e num PWA instalado, sair do `scope` do
manifesto fica a cargo do sistema operacional — o botão fica preso em "Abrindo…" para
sempre. Pior: nesse caminho a promise da action é **rejeitada**, então um `await` sem
`catch` engole o erro. Zero mensagem, zero saída.

```js
// ✗ a ação nunca vê se a navegação aconteceu
redirect(linkExterno);

// ✓ devolva o link e navegue no cliente
return { link: linkExterno };
```

No cliente, dispare a navegação de um **efeito** (não de dentro da transição, senão o React
ainda não comitou nada no DOM) e deixe um `<a href>` visível como plano B. Clique em âncora
é a única forma de sair de um app instalado que todo navegador respeita.

### Service worker não é o culpado

Vale registrar para poupar sua investigação: um service worker **não** intercepta navegação
de topo para outra origem. A especificação casa a URL de destino contra os escopos
registrados, e um handler de `fetch` que já sai cedo em `request.method !== 'GET'` nem vê o
POST da Server Action.

---

## Checklist de implantação

- [ ] Chave de **produção** começa com `$aact_prod_` — uma chave de sandbox em produção aponta para o sandbox sem avisar ninguém
- [ ] Em arquivos `.env` o `$` está escapado; em painel de variáveis, não
- [ ] A URL do webhook é o **domínio de produção**, conferida caractere por caractere
- [ ] O `authToken` do webhook é idêntico à variável do seu ambiente
- [ ] `CHECKOUT_PAID` está entre os eventos assinados, se usa checkout hospedado
- [ ] A URL de callback do checkout também é o domínio de produção
- [ ] O endpoint do webhook responde de fora, sem autenticação de plataforma na frente (teste com `curl`)
- [ ] Migrations aplicadas **antes** do deploy que as consome
- [ ] Um pagamento real de valor mínimo, feito por você, chegou na conta certa

**O teste que fecha tudo:** pague de verdade, uma vez, no seu próprio produto, e verifique no
banco que a conta foi creditada. É o único teste que exercita URL, token, evento, vínculo e
portão de acesso ao mesmo tempo — e todos os erros deste documento aparecem nele.

---

## Onde isto está implementado neste repo

| Arquivo | Papel |
|---|---|
| `src/lib/billing/asaas.ts` | Cliente HTTP, ambiente por prefixo, sanitização de erro |
| `src/lib/billing/state.ts` | Regras puras: estado da assinatura e portão de acesso (testado) |
| `src/lib/billing/cpf-cnpj.ts` | Validação de CPF e CNPJ alfanumérico (testado) |
| `src/lib/billing/plan.ts` | Constantes do plano, datas e fuso |
| `src/features/billing/subscription.ts` | Checkout, adoção da assinatura, sincronização, cancelamento |
| `src/app/api/asaas/webhook/route.ts` | Webhook: autenticação, idempotência, resolução da conta |
| `scripts/asaas-sandbox.mjs` | Ferramenta de teste local |
| `docs/DEPLOY.md` §5 | Configuração de produção e do webhook |
