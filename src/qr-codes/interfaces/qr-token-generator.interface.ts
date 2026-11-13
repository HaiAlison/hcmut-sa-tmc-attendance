
export interface GeneratedQrToken {
  id: string;
  payload: string;
  expiresAt: Date;
}

export interface IQrTokenGenerator {
  generateToken(factoryId: string, validityDays?: number): GeneratedQrToken;
}

export const QR_TOKEN_GENERATOR = Symbol('QR_TOKEN_GENERATOR');

