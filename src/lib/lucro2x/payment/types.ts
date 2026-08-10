// Contrato genérico de "gerar cobrança Pix" — o resto do código (rota de
// API, formulário) fala só com essa interface. Trocar de gateway (Mercado
// Pago → Efí, Asaas, PagSeguro...) é escrever um novo arquivo que a
// implementa, sem tocar em mais nada.

export type PixChargeInput = {
  amountCents: number;
  description: string;
  payer: {
    firstName: string;
    lastName: string;
    email: string;
    cpf: string; // só dígitos
    phone: string; // só dígitos
  };
};

export type PixChargeResult = {
  chargeId: string;
  /** Código "copia e cola" (BR Code / EMV) */
  copyPasteCode: string;
  /** Imagem do QR Code em base64 (sem o prefixo data:) */
  qrCodeBase64: string;
  /** ISO 8601 — quando esse Pix expira */
  expiresAt: string;
};

export interface PixGateway {
  name: string;
  isConfigured(): boolean;
  createCharge(input: PixChargeInput): Promise<PixChargeResult>;
}
