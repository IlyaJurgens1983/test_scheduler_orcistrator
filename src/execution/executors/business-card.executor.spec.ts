import { BusinessCardExecutor } from './business-card.executor';

describe('BusinessCardExecutor', () => {
  let executor: BusinessCardExecutor;

  beforeEach(() => {
    executor = new BusinessCardExecutor();
  });

  it('generates a card with default values when config is empty', async () => {
    const result = (await executor.execute({}, {})) as {
      card: Record<string, unknown>;
      filename: string;
      mimeType: string;
      size: number;
    };

    expect(result.card.fullName).toBe('Ivan Ivanov');
    expect(result.card.title).toBe('Backend Developer');
    expect(result.card.email).toBe('ivan@example.com');
    expect(result.card.skills).toEqual(['NestJS', 'GraphQL', 'Prisma']);
    expect(result.filename).toBe('business-card.json');
    expect(result.mimeType).toBe('application/json');
    expect(typeof result.size).toBe('number');
    expect(result.card.generatedAt).toBeDefined();
  });

  it('uses provided config values', async () => {
    const config = {
      fullName: 'Maria Smirnova',
      title: 'DevOps Engineer',
      email: 'maria@example.com',
      company: 'ACME',
      phone: '+7 900 123-45-67',
      website: 'https://maria.dev',
      skills: ['AWS', 'Kubernetes'],
    };

    const result = (await executor.execute(config, {})) as {
      card: Record<string, unknown>;
    };

    expect(result.card.fullName).toBe('Maria Smirnova');
    expect(result.card.title).toBe('DevOps Engineer');
    expect(result.card.email).toBe('maria@example.com');
    expect(result.card.company).toBe('ACME');
    expect(result.card.phone).toBe('+7 900 123-45-67');
    expect(result.card.website).toBe('https://maria.dev');
    expect(result.card.skills).toEqual(['AWS', 'Kubernetes']);
  });
});
