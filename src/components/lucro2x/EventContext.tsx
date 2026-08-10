import { eventInfo } from "@/lib/lucro2x/config";
import { Section } from "./Section";

export function EventContext() {
  return (
    <Section className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Você acabou de acompanhar uma conversa sobre crescimento, lucro e patrimônio.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Na transmissão de {eventInfo.liveLabel}, o assunto foi como estruturar melhor uma empresa
          para gerar mais resultado — e como transformar esse resultado em patrimônio de verdade. O
          que você vê abaixo é a continuação prática dessa conversa: uma oportunidade apresentada a
          quem acompanhou a transmissão, para sair da visão e entrar na execução.
        </p>
      </div>
    </Section>
  );
}
