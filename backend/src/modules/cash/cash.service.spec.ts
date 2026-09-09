import { Test, TestingModule } from '@nestjs/testing';
import { CashService } from './cash.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CashService', () => {
  let service: CashService;
  let prisma: any;

  const mockPrisma = {
    organizerMember: { findFirst: jest.fn() },
    organizer: { findUnique: jest.fn() },
    event: { findUnique: jest.fn(), findMany: jest.fn() },
    cashTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CashService>(CashService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('getOrganizerCashSummary', () => {
    it('should aggregate SUM of cash across all events belonging to organizer', async () => {
      mockPrisma.organizerMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: 'owner',
        organizer: { id: 'org-1' },
      });

      mockPrisma.event.findMany.mockResolvedValue([
        {
          id: 'ev-1',
          title: 'Concert A',
          status: 'PUBLISHED',
          startDate: new Date(),
          cashTransactions: [
            { amount: 150000, type: 'ticket_sale' },
            { amount: 50000, type: 'merchandise_sale' },
          ],
        },
        {
          id: 'ev-2',
          title: 'Festival B',
          status: 'PUBLISHED',
          startDate: new Date(),
          cashTransactions: [
            { amount: 300000, type: 'ticket_sale' },
          ],
        },
      ]);

      const result = await service.getOrganizerCashSummary('user-1');

      expect(result.grandTotalCash).toBe(500000); // 150k + 50k + 300k = 500k
      expect(result.totalEvents).toBe(2);
      expect(result.events[0].totalCash).toBe(200000);
      expect(result.events[1].totalCash).toBe(300000);
    });
  });
});
