import { WebhookExecutor } from './webhook.executor';

describe('WebhookExecutor', () => {
  let executor: WebhookExecutor;
  const originalFetch = global.fetch;

  beforeEach(() => {
    executor = new WebhookExecutor();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws if url is missing', async () => {
    await expect(executor.execute({}, {})).rejects.toThrow('missing "url"');
  });

  it('POSTs context payload and returns status + parsed body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ received: true }),
    }) as unknown as typeof fetch;

    const context = { card: { fullName: 'Ivan' } };
    const result = (await executor.execute(
      { url: 'https://httpbin.org/post' },
      context,
    )) as { status: number; body: unknown };

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];

    expect(url).toBe('https://httpbin.org/post');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual(context);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ received: true });
  });

  it('honours custom method and headers', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      statusText: 'Accepted',
      text: async () => '{"ok":1}',
    }) as unknown as typeof fetch;

    const config = {
      url: 'https://example.com/hook',
      method: 'PUT',
      headers: { Authorization: 'Bearer token' },
    };

    await executor.execute(config, { a: 1 });

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://example.com/hook');
    expect(options.method).toBe('PUT');
    expect(options.headers.Authorization).toBe('Bearer token');
  });

  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'error',
    }) as unknown as typeof fetch;

    await expect(
      executor.execute({ url: 'https://example.com/hook' }, {}),
    ).rejects.toThrow('500');
  });

  it('stores non-JSON body as text', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => 'plain text response',
    }) as unknown as typeof fetch;

    const result = (await executor.execute(
      { url: 'https://example.com/hook' },
      {},
    )) as { body: unknown };

    expect(result.body).toBe('plain text response');
  });
});
