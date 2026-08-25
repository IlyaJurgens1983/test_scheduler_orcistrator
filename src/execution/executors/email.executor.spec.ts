import { EmailExecutor } from './email.executor';

describe('EmailExecutor', () => {
  let executor: EmailExecutor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    executor = new EmailExecutor();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('sends email stub with default recipient', async () => {
    const result = (await executor.execute({}, {})) as {
      to: string;
      sent: boolean;
      provider: string;
    };

    expect(result.to).toBe('demo@example.com');
    expect(result.sent).toBe(true);
    expect(result.provider).toBe('stub');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('demo@example.com'),
    );
  });

  it('uses provided config and includes context in body', async () => {
    const config = { to: 'boss@example.com', subject: 'Report' };
    const context = { card: { fullName: 'Ivan' } };

    const result = (await executor.execute(config, context)) as {
      to: string;
      subject: string;
    };

    expect(result.to).toBe('boss@example.com');
    expect(result.subject).toBe('Report');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"fullName": "Ivan"'),
    );
  });
});
