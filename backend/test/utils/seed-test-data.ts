import { PrismaClient, OrderStatus, PaymentStatus, TicketStatus, EventStatus } from '@prisma/client';
import * as crypto from 'crypto';

export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<Parameters<PrismaClient['user']['create']>[0]['data']> = {},
) {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return prisma.user.create({
    data: {
      email: `test-user-${randomSuffix}@example.com`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
      role: 'buyer',
      ...overrides,
    },
  });
}

export async function createTestOrganizer(
  prisma: PrismaClient,
  userId: string,
  overrides: Partial<Parameters<PrismaClient['organizer']['create']>[0]['data']> = {},
) {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const organizer = await prisma.organizer.create({
    data: {
      userId,
      name: `Test Organizer ${randomSuffix}`,
      slug: `test-org-${randomSuffix}`,
      status: 'active',
      ...overrides,
    },
  });

  // Pastikan ada OrganizerMember owner
  await prisma.organizerMember.create({
    data: {
      organizerId: organizer.id,
      userId,
      role: 'owner',
      status: 'active',
    },
  });

  return organizer;
}

export async function createTestEvent(
  prisma: PrismaClient,
  organizerId: string,
  overrides: Partial<Parameters<PrismaClient['event']['create']>[0]['data']> = {},
) {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return prisma.event.create({
    data: {
      organizerId,
      title: `Test Event ${randomSuffix}`,
      slug: `test-event-${randomSuffix}`,
      status: EventStatus.PUBLISHED,
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      venue: 'Jakarta Convention Center',
      city: 'Jakarta',
      ...overrides,
    },
  });
}

export async function createTestTicketCategory(
  prisma: PrismaClient,
  eventId: string,
  overrides: Partial<Parameters<PrismaClient['ticketCategory']['create']>[0]['data']> = {},
) {
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return prisma.ticketCategory.create({
    data: {
      eventId,
      name: `Regular Ticket ${randomSuffix}`,
      price: 100000,
      quota: 10,
      sold: 0,
      ...overrides,
    },
  });
}

export async function createTestVoucher(
  prisma: PrismaClient,
  organizerId: string,
  overrides: Partial<Parameters<PrismaClient['voucher']['create']>[0]['data']> = {},
) {
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return prisma.voucher.create({
    data: {
      organizerId,
      code: `DISC-${randomSuffix}`,
      type: 'fixed',
      value: 20000,
      status: 'active',
      validFrom: new Date(Date.now() - 86400000),
      validUntil: new Date(Date.now() + 86400000),
      usageCount: 0,
      usageLimit: 100,
      ...overrides,
    },
  });
}

export async function createTestFacility(
  prisma: PrismaClient,
  eventId: string,
  overrides: Partial<Parameters<PrismaClient['eventFacility']['create']>[0]['data']> = {},
) {
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return prisma.eventFacility.create({
    data: {
      eventId,
      name: `VIP Lounge Access ${randomSuffix}`,
      price: 50000,
      quota: 10,
      sold: 0,
      ...overrides,
    },
  });
}

export async function createTestOrder(
  prisma: PrismaClient,
  buyerId: string,
  eventId: string,
  overrides: Partial<Parameters<PrismaClient['order']['create']>[0]['data']> = {},
) {
  return prisma.order.create({
    data: {
      buyerId,
      eventId,
      totalAmount: 100000,
      status: OrderStatus.PENDING,
      expiredAt: new Date(Date.now() + 10 * 60 * 1000),
      ...overrides,
    },
  });
}
