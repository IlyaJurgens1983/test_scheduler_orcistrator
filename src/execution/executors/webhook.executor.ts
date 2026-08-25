import { Injectable } from '@nestjs/common';
import { StepExecutor } from '../step-executor.interface';

export interface WebhookConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}

@Injectable()
export class WebhookExecutor implements StepExecutor {
  async execute(
    config: WebhookConfig,
    context: Record<string, unknown>,
  ): Promise<unknown> {
    const url = config.url;
    if (!url) {
      throw new Error('webhook.call: missing "url" in config');
    }

    // Payload: merge step outputs available in context
    const payload = context;

    const method = (config.method || 'POST').toUpperCase();

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(
        `webhook.call: ${url} responded with ${res.status} ${res.statusText}`,
      );
    }

    let responseBody: unknown;
    const text = await res.text();
    try {
      responseBody = text ? JSON.parse(text) : null;
    } catch {
      responseBody = text;
    }

    return {
      status: res.status,
      body: responseBody,
    };
  }
}
