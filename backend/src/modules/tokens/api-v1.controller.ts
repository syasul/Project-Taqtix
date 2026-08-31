import {
  Controller,
  Get,
  UseGuards,
  Req,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public External API v1 (X-API-Key)')
@Public() // Bypass JwtAuthGuard, use ApiKeyAuthGuard instead
@UseGuards(ApiKeyAuthGuard)
@ApiHeader({
  name: 'X-API-Key',
  description: 'Secret API key format: taq_live_xxxxxxxx',
  required: true,
})
@Controller('api/v1')
export class ApiV1Controller {
  constructor(private readonly prisma: PrismaService) {}

  @Get('events')
  @ApiOperation({ summary: 'Mendapatkan daftar event milik organizer (Public API v1)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar event berhasil diambil.' })
  async getEvents(@Req() req: any) {
    const organizer = req.organizer;

    const events = await this.prisma.event.findMany({
      where: { organizerId: organizer.id },
      include: {
        ticketCategories: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return {
      success: true,
      organizer: { id: organizer.id, name: organizer.name },
      count: events.length,
      data: events,
    };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Mendapatkan daftar pesanan tiket (Public API v1)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar pesanan berhasil diambil.' })
  async getOrders(
    @Req() req: any,
    @Query('eventId') eventId?: string,
  ) {
    const organizer = req.organizer;

    const where: any = {
      event: {
        organizerId: organizer.id,
      },
    };

    if (eventId) {
      where.eventId = eventId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            ticketCategory: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      count: orders.length,
      data: orders,
    };
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Mendapatkan daftar kehadiran / scan log (Public API v1)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Daftar kehadiran berhasil diambil.' })
  async getAttendance(
    @Req() req: any,
    @Query('eventId') eventId?: string,
  ) {
    const organizer = req.organizer;

    const where: any = {
      event: {
        organizerId: organizer.id,
      },
    };

    if (eventId) {
      where.eventId = eventId;
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        orderItem: {
          include: {
            ticketCategory: true,
          },
        },
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      count: tickets.length,
      data: tickets.map((t) => ({
        ticketId: t.id,
        eventId: t.eventId,
        attendeeName: t.orderItem.attendeeName,
        attendeeEmail: t.orderItem.attendeeEmail,
        ticketCategory: t.orderItem.ticketCategory.name,
        status: t.status,
        checkedInAt: t.checkedInAt,
        wristbandCode: t.wristbandCode,
        isBlocked: t.isBlocked,
      })),
    };
  }
}
