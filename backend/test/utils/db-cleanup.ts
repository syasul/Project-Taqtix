import { PrismaClient } from '@prisma/client';

export async function cleanupDatabase(prisma: PrismaClient) {
  const tableNames = [
    'ScanLog',
    'Ticket',
    'Payment',
    'OrderItem',
    'Order',
    'EventFacility',
    'TicketCategory',
    'Voucher',
    'PromoCode',
    'DoorprizeWinner',
    'DoorprizeItem',
    'GateStaff',
    'GateDevice',
    'Partner',
    'CustomFormField',
    'Event',
    'OrganizerMember',
    'Organizer',
    'User',
  ];

  try {
    for (const table of tableNames) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
  } catch (error) {
    // Fallback: deleteMany jika raw TRUNCATE gagal (misal SQLite atau mock)
    for (const table of tableNames) {
      const modelKey = table.charAt(0).toLowerCase() + table.slice(1);
      if ((prisma as any)[modelKey]?.deleteMany) {
        try {
          await (prisma as any)[modelKey].deleteMany({});
        } catch {
          // Ignore table cleanup error
        }
      }
    }
  }
}
