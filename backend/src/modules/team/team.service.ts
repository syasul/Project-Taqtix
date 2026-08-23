import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeamService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  /**
   * Mengundang member tim baru ke organizer.
   */
  async invite(email: string, role: string, invitedByUserId: string) {
    // Cari organizer dari user yang mengundang
    const inviterMember = await this.prisma.organizerMember.findFirst({
      where: { userId: invitedByUserId, status: 'active' },
    });
    
    let organizerId = inviterMember?.organizerId;

    if (!organizerId) {
      // Fallback ke legacy
      const org = await this.prisma.organizer.findUnique({
        where: { userId: invitedByUserId },
      });
      if (!org) {
        throw new ForbiddenException('Anda tidak memiliki profil organizer');
      }
      organizerId = org.id;
    }

    // Cek apakah email sudah terdaftar sebagai member di organizer ini
    const existingMember = await this.prisma.organizerMember.findUnique({
      where: {
        organizerId_email: {
          organizerId,
          email,
        },
      },
    });

    if (existingMember && existingMember.status !== 'removed') {
      throw new ConflictException('EMAIL_ALREADY_MEMBER');
    }

    // Generate inviteToken (32 characters hex) dan exp (7 hari)
    const inviteToken = crypto.randomBytes(16).toString('hex');
    const invitedAt = new Date();

    const data = {
      organizerId,
      email,
      role,
      status: 'pending',
      inviteToken,
      invitedBy: invitedByUserId,
      invitedAt,
    };

    let member;
    if (existingMember && existingMember.status === 'removed') {
      // Re-invite removed member
      member = await this.prisma.organizerMember.update({
        where: { id: existingMember.id },
        data,
      });
    } else {
      member = await this.prisma.organizerMember.create({
        data,
      });
    }

    // Simulasi pengiriman email / WhatsApp dengan log ke konsol
    console.log(`[INVITE MAIL] Link: https://app.taqtix.id/team/accept/${inviteToken}`);

    return {
      id: member.id,
      email: member.email,
      role: member.role,
      status: member.status,
      inviteToken: member.inviteToken, // Expose token for testing/dev environments
    };
  }

  /**
   * Menerima undangan dan melengkapi data user.
   */
  async acceptInvite(token: string, name: string, passwordHash: string) {
    const member = await this.prisma.organizerMember.findUnique({
      where: { inviteToken: token },
    });

    if (!member) {
      throw new NotFoundException('Token undangan tidak valid');
    }

    if (member.status === 'active') {
      throw new ConflictException('INVITE_ALREADY_USED');
    }

    // Expiry check (7 hari)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (member.invitedAt < sevenDaysAgo) {
      throw new GoneException('INVITE_EXPIRED');
    }

    // Cari user existing berdasarkan email
    let user = await this.prisma.user.findUnique({
      where: { email: member.email },
    });

    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    if (!user) {
      // Buat user baru dengan role organizer_member
      user = await this.prisma.user.create({
        data: {
          email: member.email,
          passwordHash: hashedPassword,
          role: 'organizer_member',
        },
      });
    } else {
      // Jika user sudah ada (misal buyer), update password dan tambahkan role
      // Untuk kesederhanaan, jika user.role bukan admin/organizer_member, ubah ke organizer_member
      if (user.role !== 'admin') {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: hashedPassword,
            role: 'organizer_member',
          },
        });
      }
    }

    // Update status OrganizerMember
    await this.prisma.organizerMember.update({
      where: { id: member.id },
      data: {
        userId: user.id,
        status: 'active',
        joinedAt: new Date(),
        inviteToken: null, // clear token
      },
    });

    // Buat token JWT untuk session
    return this.authService.generateTokenPair(user.id, user.email, user.role);
  }

  /**
   * Mendapatkan daftar member tim.
   */
  async getTeam(userId: string) {
    const activeMember = await this.prisma.organizerMember.findFirst({
      where: { userId, status: 'active' },
    });

    let organizerId = activeMember?.organizerId;

    if (!organizerId) {
      const org = await this.prisma.organizer.findUnique({
        where: { userId },
      });
      if (!org) {
        throw new ForbiddenException('Pengguna tidak memiliki profil organizer');
      }
      organizerId = org.id;
    }

    return this.prisma.organizerMember.findMany({
      where: {
        organizerId,
      },
      include: {
        user: {
          select: {
            lastLoginAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Mengubah role member tim.
   */
  async updateRole(memberId: string, role: string, ownerUserId: string) {
    const member = await this.prisma.organizerMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member tidak ditemukan');
    }

    // Jika yang diubah adalah owner, validasi apakah ada owner lain yang aktif
    if (member.role === 'owner' && role !== 'owner') {
      const otherOwnersCount = await this.prisma.organizerMember.count({
        where: {
          organizerId: member.organizerId,
          role: 'owner',
          status: 'active',
          id: { not: memberId },
        },
      });

      if (otherOwnersCount === 0) {
        throw new ConflictException('LAST_OWNER_CANNOT_DEMOTE');
      }
    }

    return this.prisma.organizerMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  /**
   * Menghapus member dari tim (soft delete).
   */
  async removeMember(memberId: string, ownerUserId: string) {
    const member = await this.prisma.organizerMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member tidak ditemukan');
    }

    // Mencegah menghapus owner satu-satunya
    if (member.role === 'owner') {
      const otherOwnersCount = await this.prisma.organizerMember.count({
        where: {
          organizerId: member.organizerId,
          role: 'owner',
          status: 'active',
          id: { not: memberId },
        },
      });

      if (otherOwnersCount === 0) {
        throw new ConflictException('LAST_OWNER_CANNOT_REMOVE');
      }
    }

    // Soft delete member
    return this.prisma.organizerMember.update({
      where: { id: memberId },
      data: {
        status: 'removed',
        removedAt: new Date(),
        userId: null, // unlink user id
      },
    });
  }
}
