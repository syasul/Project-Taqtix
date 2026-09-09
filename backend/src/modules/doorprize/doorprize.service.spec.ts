import { Test, TestingModule } from '@nestjs/testing';
import { DoorprizeService } from './doorprize.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('DoorprizeService', () => {
  let service: DoorprizeService;
  let prisma: any;

  const mockPrisma = {
    organizerMember: { findFirst: jest.fn() },
    organizer: { findUnique: jest.fn() },
    event: { findUnique: jest.fn() },
    doorprizeItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    doorprizeWinner: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    ticket: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoorprizeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DoorprizeService>(DoorprizeService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('drawWinner', () => {
    it('should randomly select an eligible checked-in ticket and exclude previous winners', async () => {
      mockPrisma.organizerMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: 'owner',
        organizer: { id: 'org-1' },
      });
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event-1',
        organizerId: 'org-1',
      });

      mockPrisma.doorprizeItem.findUnique.mockResolvedValue({
        id: 'item-1',
        eventId: 'event-1',
        name: 'iPhone 16 Pro',
        remainingQuantity: 1,
      });

      // 3 checked-in tickets, but ticket-1 already won earlier
      mockPrisma.ticket.findMany.mockResolvedValue([
        {
          id: 'ticket-1',
          orderItem: { attendeeName: 'Alice', attendeeEmail: 'alice@test.com' },
        },
        {
          id: 'ticket-2',
          orderItem: { attendeeName: 'Bob', attendeeEmail: 'bob@test.com' },
        },
      ]);

      mockPrisma.doorprizeWinner.findMany.mockResolvedValue([
        { ticketId: 'ticket-1', doorprizeItemId: 'prev-item' },
      ]);

      mockPrisma.doorprizeWinner.create.mockImplementation(({ data }: any) => ({
        id: 'winner-1',
        ...data,
        drawnAt: new Date(),
      }));

      const result = await service.drawWinner(
        'event-1',
        'item-1',
        { excludeWinnersFromPreviousDraws: true },
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.winner.ticketId).toBe('ticket-2');
      expect(result.winner.winnerName).toBe('Bob');
      expect(mockPrisma.doorprizeItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { remainingQuantity: { decrement: 1 } },
      });
    });

    it('should throw BadRequestException if item has 0 remainingQuantity', async () => {
      mockPrisma.organizerMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: 'owner',
        organizer: { id: 'org-1' },
      });
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'event-1',
        organizerId: 'org-1',
      });

      mockPrisma.doorprizeItem.findUnique.mockResolvedValue({
        id: 'item-empty',
        eventId: 'event-1',
        name: 'Smart TV',
        remainingQuantity: 0,
      });

      await expect(
        service.drawWinner('event-1', 'item-empty', {}, 'user-1'),
      ).rejects.toThrow('Kuantitas hadiah ini sudah habis terundi.');
    });
  });
});
