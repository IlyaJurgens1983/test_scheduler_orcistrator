import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;

  const prismaMock = {
    job: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    jobRun: {
      findMany: jest.fn(),
    },
    stepRun: {
      findMany: jest.fn(),
    },
  };

  const schedulerServiceMock = {
    rescheduleJob: jest.fn(),
    unregisterJob: jest.fn(),
  };

  const queueServiceMock = {
    enqueueJob: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobsService(
      prismaMock as never,
      schedulerServiceMock as never,
      queueServiceMock as never,
    );
  });

  describe('findAll', () => {
    it('returns all jobs ordered by createdAt asc', async () => {
      const jobs = [{ id: 1 }, { id: 2 }];
      prismaMock.job.findMany.mockResolvedValue(jobs);

      const result = await service.findAll();

      expect(result).toEqual(jobs);
      expect(prismaMock.job.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns a job when it exists', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 5 });

      const result = await service.findOne(5);

      expect(result).toEqual({ id: 5 });
      expect(prismaMock.job.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    it('throws NotFoundException when job does not exist', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a job, parses params JSON and reschedules it', async () => {
      const input = {
        key: 'test-job',
        name: 'Test Job',
        description: 'desc',
        cron: '0 * * * *',
        timezone: 'Europe/Moscow',
        enabled: true,
        params: '{"steps":[{"type":"email.send"}]}',
      };
      const created = { id: 1, ...input, timezone: 'Europe/Moscow' };
      prismaMock.job.create.mockResolvedValue(created);

      const result = await service.create(input as never);

      expect(prismaMock.job.create).toHaveBeenCalledWith({
        data: {
          key: 'test-job',
          name: 'Test Job',
          description: 'desc',
          cron: '0 * * * *',
          timezone: 'Europe/Moscow',
          enabled: true,
          params: { steps: [{ type: 'email.send' }] },
        },
      });
      expect(schedulerServiceMock.rescheduleJob).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('applies default timezone and enabled when omitted', async () => {
      const input = { key: 'k', name: 'N', cron: '* * * * *' };
      prismaMock.job.create.mockResolvedValue({ id: 2 });

      await service.create(input as never);

      expect(prismaMock.job.create).toHaveBeenCalledWith({
        data: {
          key: 'k',
          name: 'N',
          description: undefined,
          cron: '* * * * *',
          timezone: 'UTC',
          enabled: true,
          params: undefined,
        },
      });
    });

    it('throws when params is invalid JSON', async () => {
      const input = {
        key: 'k',
        name: 'N',
        cron: '* * * * *',
        params: '{invalid json',
      };

      await expect(service.create(input as never)).rejects.toThrow(
        'Invalid JSON in params',
      );
    });
  });

  describe('update', () => {
    it('updates an existing job and reschedules it', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 1 });
      const updated = { id: 1, key: 'new-key' };
      prismaMock.job.update.mockResolvedValue(updated);

      const input = { id: 1, key: 'new-key' };
      const result = await service.update(input as never);

      expect(prismaMock.job.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          key: 'new-key',
          name: undefined,
          description: undefined,
          cron: undefined,
          timezone: undefined,
          enabled: undefined,
          params: undefined,
        },
      });
      expect(schedulerServiceMock.rescheduleJob).toHaveBeenCalledWith(updated);
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when updating a missing job', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.update({ id: 42 } as never)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.job.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('unregisters and deletes an existing job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 1, key: 'demo' });
      prismaMock.job.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(schedulerServiceMock.unregisterJob).toHaveBeenCalledWith('demo');
      expect(prismaMock.job.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when removing a missing job', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.remove(7)).rejects.toThrow(NotFoundException);
      expect(prismaMock.job.delete).not.toHaveBeenCalled();
    });
  });

  describe('run', () => {
    it('enqueues a manual run for an existing job', async () => {
      prismaMock.job.findUnique.mockResolvedValue({ id: 3 });

      const result = await service.run(3);

      expect(queueServiceMock.enqueueJob).toHaveBeenCalledWith(3, 'manual');
      expect(result).toBe(true);
    });

    it('throws NotFoundException when running a missing job', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.run(8)).rejects.toThrow(NotFoundException);
      expect(queueServiceMock.enqueueJob).not.toHaveBeenCalled();
    });
  });

  describe('runs', () => {
    it('returns recent runs for a job', async () => {
      const runs = [{ id: 1 }, { id: 2 }];
      prismaMock.jobRun.findMany.mockResolvedValue(runs);

      const result = await service.runs(3);

      expect(result).toEqual(runs);
      expect(prismaMock.jobRun.findMany).toHaveBeenCalledWith({
        where: { jobId: 3 },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('stepRuns', () => {
    it('returns step runs for a run ordered by startedAt', async () => {
      const steps = [{ id: 1 }];
      prismaMock.stepRun.findMany.mockResolvedValue(steps);

      const result = await service.stepRuns(10);

      expect(result).toEqual(steps);
      expect(prismaMock.stepRun.findMany).toHaveBeenCalledWith({
        where: { jobRunId: 10 },
        orderBy: { startedAt: 'asc' },
      });
    });
  });
});
