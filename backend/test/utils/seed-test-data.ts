import { PrismaClient, OrderStatus, PaymentStatus, TicketStatus, EventStatus } from '@prisma/client';
import * as crypto from 'crypto';

export async function createTestUser(
  prisma: PrismaClient,
  overrides: Record<string, any> = {},
) {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return prisma.user.create({
    data: {
      email: `test-user-${randomSuffix}@example.com`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
      role: 'buyer',
      ...overrides,
    } as any,
  });
}

export async function createTestOrganizer(
  prisma: PrismaClient,
  userId: string,
  overrides: Record<string, any> = {},
) {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const organizer = await prisma.organizer.create({
    data: {
      userId,
      name: `Test Organizer ${randomSuffix}`,
      slug: `test-org-${randomSuffix}`,
      status: 'active',
      ...overrides,
    } as any,
  });

  // Pastikan ada OrganizerMember owner
  await prisma.organizerMember.create({
    data: {
      organizerId: organizer.id,
      userId,
      email: 'owner@test.com',
      invitedBy: userId,
      role: 'owner',
      status: 'active',
    },
  });

  return organizer;
}

export async function createTestEvent(
  prisma: PrismaClient,
  organizerId: string,
  overrides: Record<string, any> = {},
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
      location: 'Jakarta Convention Center',
      ...overrides,
    } as any,
  });
}

export async function createTestTicketCategory(
  prisma: PrismaClient,
  eventId: string,
  overrides: Record<string, any> = {},
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
    } as any,
  });
}

export async function createTestVoucher(
  prisma: PrismaClient,
  organizerId: string,
  overrides: Record<string, any> = {},
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
    } as any,
  });
}

export async function createTestFacility(
  prisma: PrismaClient,
  eventId: string,
  overrides: Record<string, any> = {},
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
    } as any,
  });
}

export async function createTestOrder(
  prisma: PrismaClient,
  buyerId: string,
  eventId: string,
  overrides: Record<string, any> = {},
) {
  return prisma.order.create({
    data: {
      buyerId,
      eventId,
      totalAmount: 100000,
      status: OrderStatus.PENDING,
      expiredAt: new Date(Date.now() + 10 * 60 * 1000),
      ...overrides,
    } as any,
  });
}
