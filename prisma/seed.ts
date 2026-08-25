import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoJob = await prisma.job.upsert({
    where: { key: 'demo-business-card' },
    update: {},
    create: {
      key: 'demo-business-card',
      name: 'Demo: digital business card',
      description:
        'Generates a digital business card and delivers it via webhook (demo pipeline).',
      cron: '*/5 * * * *',
      timezone: 'UTC',
      enabled: true,
      params: {
        steps: [
          {
            id: 'card',
            type: 'business_card.generate',
            config: {
              fullName: 'Ivan Petrov',
              title: 'Backend Developer',
              email: 'ivan.petrov@example.com',
              company: 'Example Inc',
              phone: '+7 900 000-00-00',
              skills: ['NestJS', 'GraphQL', 'Prisma', 'BullMQ', 'Docker'],
            },
          },
          {
            id: 'deliver',
            type: 'webhook.call',
            config: {
              url: 'https://httpbin.org/post',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          },
        ],
      },
    },
  });

  console.log(`Seed done. Demo job: ${demoJob.key} (id=${demoJob.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
