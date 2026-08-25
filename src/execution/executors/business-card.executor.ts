import { Injectable } from '@nestjs/common';
import { StepExecutor } from '../step-executor.interface';

export interface BusinessCardConfig {
  fullName?: string;
  title?: string;
  email?: string;
  company?: string;
  phone?: string;
  website?: string;
  skills?: string[];
}

@Injectable()
export class BusinessCardExecutor implements StepExecutor {
  async execute(
    config: BusinessCardConfig,
    _context: Record<string, unknown>,
  ): Promise<unknown> {
    const card = {
      fullName: config.fullName || 'Ivan Ivanov',
      title: config.title || 'Backend Developer',
      email: config.email || 'ivan@example.com',
      company: config.company || 'Example Inc',
      phone: config.phone || '+1 555 000 0000',
      website: config.website || 'https://example.com',
      skills: config.skills || ['NestJS', 'GraphQL', 'Prisma'],
      generatedAt: new Date().toISOString(),
    };

    return {
      card,
      filename: 'business-card.json',
      mimeType: 'application/json',
      size: Buffer.byteLength(JSON.stringify(card)),
    };
  }
}
