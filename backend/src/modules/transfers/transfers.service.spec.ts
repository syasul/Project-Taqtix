import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('TransfersService', () => {
  let service: TransfersService;
  let prisma: any;

  const mockPrisma = {
    ticket: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketTransfer: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    orderItem: {
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('test-secret-qr-key'),
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('signed-qr-token-123'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('requestTransfer', () => {
    it('should immediately set ticket status to TRANSFER_PENDING and invalidate old QR', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        status: 'VALID',
        isBlocked: false,
        event: { allowTicketTransfer: true },
        orderItem: { attendeeEmail: 'old@test.com' },
      });

      mockPrisma.ticketTransfer.findFirst.mockResolvedValue(null);

      mockPrisma.ticket.update.mockResolvedValue({});
      mockPrisma.ticketTransfer.create.mockImplementation(({ data }: any) => ({
        id: 'transfer-1',
        ...data,
      }));

      const result = await service.requestTransfer('ticket-1', {
        toName: 'New Attendee',
        toEmail: 'new@test.com',
        toPhone: '08123456789',
      });

      expect(result.ticketId).toBe('ticket-1');
      expect(result.status).toBe('pending');
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1' },
          data: expect.objectContaining({
            status: 'TRANSFER_PENDING',
            qrPayload: expect.stringMatching(/^TRANSFER_PENDING_/),
          }),
        }),
      );
    });

    it('should reject transfer if event has allowTicketTransfer disabled', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        status: 'VALID',
        isBlocked: false,
        event: { allowTicketTransfer: false },
        orderItem: { attendeeEmail: 'old@test.com' },
      });

      await expect(
        service.requestTransfer('ticket-1', {
          toName: 'New Person',
          toEmail: 'new@test.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('confirmTransfer', () => {
    it('should update attendee profile, generate a fresh valid QR, and set status to VALID', async () => {
      mockPrisma.ticketTransfer.findUnique.mockResolvedValue({
        id: 'transfer-1',
        requestToken: 'tok-abc',
        status: 'pending',
        expiresAt: new Date(Date.now() + 100000),
        toName: 'Confirmed Person',
        toEmail: 'confirmed@test.com',
        toPhone: '081111111',
        ticket: {
          id: 'ticket-1',
          eventId: 'ev-1',
          orderItemId: 'item-1',
        },
      });

      mockPrisma.ticket.update.mockResolvedValue({
        id: 'ticket-1',
        status: 'VALID',
        qrPayload: 'signed-qr-token-123',
      });

      const result = await service.confirmTransfer('tok-abc');

      expect(result.success).toBe(true);
      expect(mockPrisma.orderItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          attendeeName: 'Confirmed Person',
          attendeeEmail: 'confirmed@test.com',
          attendeePhone: '081111111',
        },
      });
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1' },
          data: expect.objectContaining({
            status: 'VALID',
            qrPayload: 'signed-qr-token-123',
          }),
        }),
      );
    });
  });
});
