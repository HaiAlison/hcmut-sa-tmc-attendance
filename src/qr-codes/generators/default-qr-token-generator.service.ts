import { Injectable } from '@nestjs/common';
import {
  GeneratedQrToken,
  IQrTokenGenerator,
} from '../interfaces/qr-token-generator.interface';
import * as crypto from 'crypto';

@Injectable()
export class DefaultQrTokenGenerator implements IQrTokenGenerator {
  generateToken(factoryId: string, validityDays = 365): GeneratedQrToken {
    const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const id = `QR-${hex}`;
    const tokenUuid = crypto.randomUUID();
    const payload = `tmc://v1/${factoryId.toLowerCase()}/token-${tokenUuid}`;
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    return {
      id,
      payload,
      expiresAt,
    };
  }
}
