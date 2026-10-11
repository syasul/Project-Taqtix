import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PRIORITAS 2.2 — Multi-Tenant Isolation (Events Module)', () => {
  let service: EventsService;
  let prisma: any;

  const mockOrgA = { id: 'org-A-id', userId: 'user-org-A', status: 'active' };
  const mockOrgB = { id: 'org-B-id', userId: 'user-org-B', status: 'active' };

  const mockEventB = {
    id: 'event-belonging-to-org-B',
    title: 'Event Milik Org B',
    organizerId: mockOrgB.id,
  };

  beforeEach(async () => {
    prisma = {
      organizer: {
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.userId === 'user-org-A') return mockOrgA;
          if (args.where?.userId === 'user-org-B') return mockOrgB;
          return null;
        }),
      },
      organizerMember: {
        findFirst: jest.fn().mockImplementation((args: any) => {
          if (args.where?.userId === 'user-org-A') {
            return { organizerId: mockOrgA.id, organizer: mockOrgA };
          }
          if (args.where?.userId === 'user-org-B') {
            return { organizerId: mockOrgB.id, organizer: mockOrgB };
          }
          return null;
        }),
      },
      event: {
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id === mockEventB.id) return mockEventB;
          return null;
        }),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('login sebagai organizer A lalu coba update event milik organizer B -> HARUS 404 Not Found (bukan 403 atau data bocor)', async () => {
    await expect(
      service.update(
        'event-belonging-to-org-B',
        { title: 'Hacked Title' },
        'user-org-A',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('login sebagai organizer A lalu coba publish event milik organizer B -> HARUS 404 Not Found', async () => {
    await expect(
      service.publish('event-belonging-to-org-B', 'user-org-A'),
    ).rejects.toThrow(NotFoundException);
  });
});
