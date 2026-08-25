import { PipelineRunnerService } from './pipeline-runner.service';

describe('PipelineRunnerService', () => {
  let service: PipelineRunnerService;

  const prismaMock = {
    job: {
      findUnique: jest.fn(),
    },
    jobRun: {
      create: jest.fn(),
      update: jest.fn(),
    },
    stepRun: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const webhookExecutorMock = { execute: jest.fn() };
  const businessCardExecutorMock = { execute: jest.fn() };
  const emailExecutorMock = { execute: jest.fn() };
  const queueServiceMock = {};

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PipelineRunnerService(
      prismaMock as never,
      webhookExecutorMock as never,
      businessCardExecutorMock as never,
      emailExecutorMock as never,
      queueServiceMock as never,
    );
  });

  describe('executeJob', () => {
    it('marks run and steps as success on a successful pipeline', async () => {
      const job = {
        id: 1,
        params: {
          steps: [
            { id: 'card', type: 'business_card.generate', config: { fullName: 'Ivan' } },
            { id: 'deliver', type: 'webhook.call', config: { url: 'https://x.test' } },
          ],
        },
      };

      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobRun.create.mockResolvedValue({ id: 10 });
      businessCardExecutorMock.execute.mockResolvedValue({ card: { fullName: 'Ivan' } });
      webhookExecutorMock.execute.mockResolvedValue({ status: 200 });
      prismaMock.stepRun.create
        .mockResolvedValueOnce({ id: 100 })
        .mockResolvedValueOnce({ id: 101 });
      prismaMock.stepRun.update.mockResolvedValue({});
      prismaMock.jobRun.update.mockResolvedValue({});

      await service.executeJob(1, 'manual');

      expect(prismaMock.jobRun.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          jobId: 1,
          trigger: 'manual',
          status: 'running',
        }),
      });

      expect(prismaMock.stepRun.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.stepRun.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { id: 100 },
          data: expect.objectContaining({ status: 'success' }),
        }),
      );
      expect(prismaMock.stepRun.update).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { id: 101 },
          data: expect.objectContaining({ status: 'success' }),
        }),
      );
      expect(prismaMock.jobRun.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: expect.objectContaining({ status: 'success' }),
      });

      // context propagates: webhook executor receives output of previous step
      const webhookConfig = (webhookExecutorMock.execute as jest.Mock).mock.calls[0][0];
      const webhookContext = (webhookExecutorMock.execute as jest.Mock).mock.calls[0][1];
      expect(webhookConfig).toEqual({ url: 'https://x.test' });
      expect(webhookContext.card).toEqual({ card: { fullName: 'Ivan' } });
    });

    it('marks run and failing step as failed when a step throws', async () => {
      const job = {
        id: 2,
        params: {
          steps: [
            { id: 'card', type: 'business_card.generate', config: {} },
            { id: 'deliver', type: 'webhook.call', config: { url: 'https://x.test' } },
          ],
        },
      };

      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobRun.create.mockResolvedValue({ id: 20 });
      businessCardExecutorMock.execute.mockResolvedValue({ card: {} });
      webhookExecutorMock.execute.mockRejectedValue(new Error('HTTP 502'));
      prismaMock.stepRun.create
        .mockResolvedValueOnce({ id: 200 })
        .mockResolvedValueOnce({ id: 201 });
      prismaMock.stepRun.update.mockResolvedValue({});
      prismaMock.jobRun.update.mockResolvedValue({});

      await service.executeJob(2, 'cron');

      // failing step recorded as failed with error message
      expect(prismaMock.stepRun.update).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { id: 201 },
          data: expect.objectContaining({ status: 'failed', error: 'HTTP 502' }),
        }),
      );
      // overall run marked as failed
      expect(prismaMock.jobRun.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: expect.objectContaining({ status: 'failed', error: 'HTTP 502' }),
      });
    });

    it('marks run as failed when step type is unknown', async () => {
      const job = {
        id: 3,
        params: {
          steps: [{ id: 'x', type: 'unknown.step', config: {} }],
        },
      };

      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobRun.create.mockResolvedValue({ id: 30 });

      await service.executeJob(3, 'manual');

      expect(prismaMock.jobRun.update).toHaveBeenCalledWith({
        where: { id: 30 },
        data: expect.objectContaining({
          status: 'failed',
          error: 'Unknown step type: unknown.step',
        }),
      });
    });

    it('does nothing when job does not exist', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await service.executeJob(999, 'manual');

      expect(prismaMock.jobRun.create).not.toHaveBeenCalled();
    });

    it('does nothing when job has no steps', async () => {
      prismaMock.job.findUnique.mockResolvedValue({
        id: 4,
        params: { steps: [] },
      });

      await service.executeJob(4, 'manual');

      expect(prismaMock.jobRun.create).not.toHaveBeenCalled();
    });
  });
});
