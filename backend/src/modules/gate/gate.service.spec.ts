import { Test, TestingModule } from '@nestjs/testing';
import { GateService } from './gate.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';

describe('PRIORITAS 2.5 & 3.3 — GateService (Blocked QR & Batch Offline Scan)', () => {
  let service: GateService;
  let prisma: any;
  let jwtService: any;

  const mockStaffUserId = 'staff-user-1';
  const mockEventId = 'event-gate-1';
  const mockTicketId = 'ticket-uuid-1';

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(prisma)),
      ticket: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      scanLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      organizer: {
        findFirst: jest.fn().mockResolvedValue({ id: mockEventId }),
      },
      gateStaff: {
        findUnique: jest.fn().mockResolvedValue({ eventId: mockEventId, userId: mockStaffUserId }),
      },
    };

    jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        ticketId: mockTicketId,
        eventId: mockEventId,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GateService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('mock-qr-secret') } },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<GateService>(GateService);
  });

  describe('2.5 — Proteksi QR Blocked', () => {
    it('harus menolak scan tiket yang status isBlocked bernilai true dengan TICKET_BLOCKED', async () => {
      prisma.ticket.findUnique.mockResolvedValue({
        id: mockTicketId,
        isBlocked: true,
        blockedReason: 'Tiket dibatalkan karena refund',
        status: TicketStatus.VALID,
        orderItem: {
          ticketCategory: {
            eventId: mockEventId,
            name: 'VIP Ticket',
          },
        },
      });

      await expect(
        service.validateTicket({ qrPayload: 'signed-qr-code' }, mockStaffUserId),
      ).rejects.toThrow(HttpException);

      try {
        await service.validateTicket({ qrPayload: 'signed-qr-code' }, mockStaffUserId);
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.FORBIDDEN);
        const response = err.getResponse();
        expect(response.code).toBe('TICKET_BLOCKED');
        expect(response.message).toBe('Tiket dibatalkan karena refund');
      }

      // Harus mencatat audit log scan dengan result: 'BLOCKED'
      expect(prisma.scanLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: mockTicketId,
          scannedById: mockStaffUserId,
          result: 'BLOCKED',
        }),
      });
    });

    it('harus menolak scan tiket berstatus TRANSFER_PENDING dengan pesan QR lama invalid', async () => {
      prisma.ticket.findUnique.mockResolvedValue({
        id: mockTicketId,
        isBlocked: false,
        status: TicketStatus.TRANSFER_PENDING,
        orderItem: {
          ticketCategory: {
            eventId: mockEventId,
            name: 'VIP Ticket',
          },
        },
      });

      await expect(
        service.validateTicket({ qrPayload: 'old-qr-code' }, mockStaffUserId),
      ).rejects.toThrow(HttpException);

      expect(prisma.scanLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: mockTicketId,
          scannedById: mockStaffUserId,
          result: 'TRANSFER_PENDING',
        }),
      });
    });
  });

  describe('3.3 — Offline Batch Scan Synchronization Conflict', () => {
    it('menangani 2 scan tiket yang sama saat batch sync: tiket pertama VALID, scan kedua DUPLICATE', async () => {
      let currentStatus: TicketStatus = TicketStatus.VALID;

      prisma.ticket.findUnique.mockImplementation(() => {
        return Promise.resolve({
          id: mockTicketId,
          eventId: mockEventId,
          status: currentStatus,
          isBlocked: false,
          orderItem: {
            ticketCategory: {
              eventId: mockEventId,
            },
          },
        });
      });

      prisma.ticket.update.mockImplementation(() => {
        currentStatus = TicketStatus.CHECKED_IN;
        return Promise.resolve({ id: mockTicketId, status: TicketStatus.CHECKED_IN });
      });

      const batchDto = {
        logs: [
          {
            qrPayload: 'qr-ticket-1',
            scannedAt: new Date(Date.now() - 5000).toISOString(),
            offlineLogId: 'offline-1',
          },
          {
            qrPayload: 'qr-ticket-1', // Scan kedua dari device offline lain untuk tiket yang sama
            scannedAt: new Date(Date.now() - 1000).toISOString(),
            offlineLogId: 'offline-2',
          },
        ],
      };

      const result = await service.syncBatch(batchDto, mockStaffUserId);

      expect(result.success).toBe(true);

      // Pastikan log pertama dicatat VALID
      expect(prisma.scanLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: mockTicketId,
            result: 'VALID',
          }),
        }),
      );

      // Pastikan log kedua dicatat DUPLICATE sebagai deteksi konflik offline
      expect(prisma.scanLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: mockTicketId,
            result: 'DUPLICATE',
          }),
        }),
      );
    });
  });

  describe('Locking 1 Tiket untuk 1 Orang vs Tiket Berpasangan (Couple)', () => {
    it('harus menolak scan tiket perorangan jika sudah CHECKED_IN (mencegah 1 tiket 2 user)', async () => {
      prisma.ticket.findUnique.mockResolvedValue({
        id: mockTicketId,
        isBlocked: false,
        status: TicketStatus.CHECKED_IN,
        orderItemId: 'item-1',
        attendeeName: 'John Doe',
        orderItem: {
          ticketCategory: {
            eventId: mockEventId,
            name: 'Tiket Perorangan Reguler',
            ticketPerPackage: 1,
          },
        },
      });

      if (!prisma.ticket.findMany) prisma.ticket.findMany = jest.fn();
      prisma.ticket.findMany.mockResolvedValue([]);
      if (!prisma.scanLog.count) prisma.scanLog.count = jest.fn();
      prisma.scanLog.count.mockResolvedValue(1);

      await expect(
        service.validateTicket({ qrPayload: 'signed-qr-code' }, mockStaffUserId),
      ).rejects.toThrow(HttpException);

      try {
        await service.validateTicket({ qrPayload: 'signed-qr-code' }, mockStaffUserId);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(err.getResponse().code).toBe('QR_ALREADY_USED');
        expect(err.getResponse().message).toContain('Tiket perorangan');
      }
    });

    it('harus mengizinkan tiket berpasangan (1 barcode shared) untuk scan orang ke-1 dan orang ke-2, lalu menolak orang ke-3', async () => {
      let scanCount = 0;
      let ticketStatus = TicketStatus.VALID;

      prisma.ticket.findUnique.mockImplementation(() =>
        Promise.resolve({
          id: mockTicketId,
          isBlocked: false,
          status: ticketStatus,
          orderItemId: 'item-couple-1',
          attendeeName: 'Pasangan Romantis',
          orderItem: {
            ticketCategory: {
              eventId: mockEventId,
              name: 'Paket Couple Berdua',
              ticketPerPackage: 2,
            },
          },
        }),
      );

      if (!prisma.ticket.findMany) prisma.ticket.findMany = jest.fn();
      prisma.ticket.findMany.mockResolvedValue([{ id: mockTicketId }]); // 1 barcode bersama

      if (!prisma.scanLog.count) prisma.scanLog.count = jest.fn();
      prisma.scanLog.count.mockImplementation(() => Promise.resolve(scanCount));

      prisma.ticket.update.mockImplementation((args: any) => {
        ticketStatus = args.data.status;
        return Promise.resolve({ id: mockTicketId, status: ticketStatus });
      });

      // Scan 1: Orang pertama masuk
      const res1 = await service.validateTicket({ qrPayload: 'signed-qr-code' }, mockStaffUserId);
      expect(res1.success).toBe(true);
      expect(res1.isCouple).toBe(true);
      expect(res1.remainingPax).toBe(1);
      scanCount = 1;

      // Scan 2: Orang kedua (pasangan) masuk
      const res2 = await service.validateTicket({ qrPayload: 'signed-qr-code' }, mockStaffUserId);
      expect(res2.success).toBe(true);
      expect(res2.isCouple).toBe(true);
      expect(res2.remainingPax).toBe(0);
      scanCount = 2;

      // Scan 3: Orang ketiga mencoba masuk dengan barcode yang sama -> Harus Ditolak!
      await expect(
        service.validateTicket({ qrPayload: 'signed-qr-code' }, mockStaffUserId),
      ).rejects.toThrow(HttpException);
    });
  });
});
