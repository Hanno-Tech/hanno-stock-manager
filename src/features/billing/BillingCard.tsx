import { ExternalLink, Receipt } from 'lucide-react';
import { Mono, StatusPill } from '@/components';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PLANO, VALOR_FORMATADO, dataDeAsaas } from '@/lib/billing/plan';
import type { BillingState } from './access';
import { temAssinaturaAtiva } from './subscription';
import BillingActions from './BillingActions';

const data = (d: Date) => d.toLocaleDateString('pt-BR');

/**
 * Bloco de assinatura no Perfil. Fora do teste e da mensalidade em dia a pessoa
 * não chega aqui — o portão manda para /assinatura antes.
 */
export default function BillingCard({ state }: { state: BillingState }) {
  // Conta de antes da cobrança existir: nada a mostrar.
  if (state.kind === 'LEGADO') return null;

  const { subscription: sub } = state;
  const noTeste = state.kind === 'TRIAL';
  const cancelada = sub?.status === 'CANCELADA';
  const temAssinatura = temAssinaturaAtiva(sub);
  const vencimento = sub?.nextDueDate ? dataDeAsaas(sub.nextDueDate) : null;
  const acessoAte = sub?.paidThrough ? data(sub.paidThrough) : null;

  // O que a agência perde ao cancelar depende de onde ela está no ciclo.
  const avisoCancelamento = acessoAte
    ? `As cobranças futuras param e a fatura em aberto é apagada. O mês que você já pagou continua valendo até ${acessoAte} — depois o app trava até você reativar.`
    : noTeste
      ? `Nenhuma cobrança será criada quando o teste acabar. Você usa até o fim dos ${PLANO.trialDias} dias e, para continuar depois disso, precisa reativar.`
      : 'A fatura em aberto é apagada e nenhuma nova cobrança é criada. O app fica travado até você reativar a assinatura.';

  return (
    <div className="w-full rounded-xl bg-card p-5 text-left ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-base font-bold">Assinatura</p>
        {cancelada || (!noTeste && !temAssinatura) ? (
          <StatusPill label={cancelada ? 'Cancelada' : 'Sem assinatura'} tone="neutral" />
        ) : noTeste ? (
          <StatusPill
            label={state.diasRestantes === 1 ? 'Teste — 1 dia' : `Teste — ${state.diasRestantes} dias`}
            tone="warning"
          />
        ) : (
          <StatusPill label="Em dia" tone="success" />
        )}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        {cancelada ? (
          <>
            Não há mais renovação programada.
            {acessoAte && <> O acesso vale até <Mono className="font-bold">{acessoAte}</Mono>.</>}
          </>
        ) : noTeste && !temAssinatura ? (
          // Durante o teste não existe assinatura no Asaas: não há valor a
          // mostrar nem data de cobrança, porque nada foi gerado.
          <>
            Nenhuma cobrança criada ainda. Quando o teste acabar, o app pede o cartão e
            passa a renovar {VALOR_FORMATADO} por mês, automaticamente.
          </>
        ) : (
          <>
            {VALOR_FORMATADO} por mês
            {vencimento && (
              <>
                {' · '}próxima em <Mono className="font-bold">{data(vencimento)}</Mono>
              </>
            )}
          </>
        )}
      </p>

      {sub?.invoiceUrl && (
        <a
          href={sub.invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 w-full')}
        >
          <Receipt />
          Ver fatura em aberto
          <ExternalLink className="size-3.5 opacity-70" />
        </a>
      )}

      {/* O cartão é coletado na página do Asaas: daqui só sai o redirect. */}
      <BillingActions
        temAssinatura={temAssinatura}
        avisoCancelamento={avisoCancelamento}
        rotuloAssinar={noTeste ? 'Assinar agora com cartão' : 'Assinar com cartão'}
      />
    </div>
  );
}
