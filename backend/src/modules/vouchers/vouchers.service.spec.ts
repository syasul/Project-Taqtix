import { Test, TestingModule } from '@nestjs/testing';
import { VouchersService } from './vouchers.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('VouchersService', () => {
  let service: VouchersService;
  let prisma: any;

  const mockPrisma = {
    organizerMember: { findFirst: jest.fn() },
    organizer: { findUnique: jest.fn() },
    event: { findUnique: jest.fn(), findMany: jest.fn() },
    voucher: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VouchersService>(VouchersService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('validateVoucher', () => {
    it('should successfully validate an active org-wide voucher with percentage discount', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event-1',
        organizerId: 'org-1',
      });

      const now = new Date();
      mockPrisma.voucher.findFirst.mockResolvedValue({
        id: 'voucher-1',
        code: 'HEMAT20',
        organizerId: 'org-1',
        eventId: null,
        applicableEventIds: null,
        type: 'percentage',
        value: 20,
        usageLimit: 100,
        usageCount: 5,
        maxDiscountAmount: 50000,
        validFrom: new Date(now.getTime() - 100000),
        validUntil: new Date(now.getTime() + 100000),
        status: 'active',
      });

      const result = await service.validateVoucher('HEMAT20', 'event-1', 200000);

      expect(result.valid).toBe(true);
      expect(result.code).toBe('HEMAT20');
      expect(result.discountAmount).toBe(40000); // 20% of 200k = 40k
    });

    it('should reject voucher when usageLimit is reached', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event-1',
        organizerId: 'org-1',
      });

      const now = new Date();
      mockPrisma.voucher.findFirst.mockResolvedValue({
        id: 'voucher-1',
        code: 'HABIS',
        organizerId: 'org-1',
        eventId: null,
        type: 'fixed',
        value: 10000,
        usageLimit: 10,
        usageCount: 10,
        validFrom: new Date(now.getTime() - 100000),
        validUntil: new Date(now.getTime() + 100000),
        status: 'active',
      });

      await expect(
        service.validateVoucher('HABIS', 'event-1', 100000),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject voucher when event does not match scoped eventId', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event-2',
        organizerId: 'org-1',
      });

      const now = new Date();
      mockPrisma.voucher.findFirst.mockResolvedValue({
        id: 'voucher-scoped',
        code: 'SPECIAL1',
        organizerId: 'org-1',
        eventId: 'event-1', // Scoped to event-1
        type: 'fixed',
        value: 15000,
        validFrom: new Date(now.getTime() - 100000),
        validUntil: new Date(now.getTime() + 100000),
        status: 'active',
      });

      await expect(
        service.validateVoucher('SPECIAL1', 'event-2', 100000),
      ).rejects.toThrow('Voucher tidak berlaku untuk event ini');
    });
  });
});
