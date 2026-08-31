import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { ReorderCustomFieldsDto } from './dto/reorder-custom-fields.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrganizerOrThrow(userId: string) {
    const member = await this.prisma.organizerMember.findFirst({
      where: { userId, status: 'active' },
      include: { organizer: true },
    });
    if (member?.organizer) return member.organizer;

    const organizer = await this.prisma.organizer.findUnique({
      where: { userId },
    });
    if (!organizer) {
      throw new ForbiddenException('Pengguna tidak memiliki profil organizer');
    }
    return organizer;
  }

  private async verifyEventOwnership(eventId: string, userId: string) {
    const organizer = await this.getOrganizerOrThrow(userId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || event.organizerId !== organizer.id) {
      throw new NotFoundException('Event tidak ditemukan atau bukan milik Anda');
    }
    return { event, organizer };
  }

  async create(eventId: string, dto: CreateCustomFieldDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    // Hitung order berikutnya jika order tidak ditentukan
    let orderIndex = dto.order;
    if (orderIndex === undefined) {
      const count = await this.prisma.customFormField.count({ where: { eventId } });
      orderIndex = count;
    }

    return this.prisma.customFormField.create({
      data: {
        eventId,
        label: dto.label,
        fieldType: dto.fieldType,
        options: dto.options ? (dto.options as any) : undefined,
        required: dto.required ?? false,
        order: orderIndex,
      },
    });
  }

  async findAll(eventId: string) {
    return this.prisma.customFormField.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });
  }

  async update(
    eventId: string,
    fieldId: string,
    dto: UpdateCustomFieldDto,
    userId: string,
  ) {
    await this.verifyEventOwnership(eventId, userId);

    const field = await this.prisma.customFormField.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.eventId !== eventId) {
      throw new NotFoundException('Field formulir tidak ditemukan');
    }

    const data: any = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.fieldType !== undefined) data.fieldType = dto.fieldType;
    if (dto.options !== undefined) data.options = dto.options;
    if (dto.required !== undefined) data.required = dto.required;
    if (dto.order !== undefined) data.order = dto.order;

    return this.prisma.customFormField.update({
      where: { id: fieldId },
      data,
    });
  }

  async delete(eventId: string, fieldId: string, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    const field = await this.prisma.customFormField.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.eventId !== eventId) {
      throw new NotFoundException('Field formulir tidak ditemukan');
    }

    return this.prisma.customFormField.delete({
      where: { id: fieldId },
    });
  }

  async reorder(eventId: string, dto: ReorderCustomFieldsDto, userId: string) {
    await this.verifyEventOwnership(eventId, userId);

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.customFormField.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { success: true, message: 'Urutan formulir berhasil diperbarui' };
  }
}
