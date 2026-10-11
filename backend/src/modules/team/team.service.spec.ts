import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { ConflictException } from '@nestjs/common';

describe('PRIORITAS 2.1 — TeamService (Owner Protection)', () => {
  let service: TeamService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      organizerMember: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      organizer: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  it('harus menolak downgrade role owner satu-satunya (LAST_OWNER_CANNOT_DEMOTE)', async () => {
    // Member saat ini adalah owner
    prisma.organizerMember.findUnique.mockResolvedValue({
      id: 'member-owner-1',
      organizerId: 'org-1',
      role: 'owner',
      status: 'active',
    });

    // Tidak ada owner lain selain member ini
    prisma.organizerMember.count.mockResolvedValue(0);

    await expect(
      service.updateRole('member-owner-1', 'admin', 'user-owner-1'),
    ).rejects.toThrow(ConflictException);

    try {
      await service.updateRole('member-owner-1', 'admin', 'user-owner-1');
    } catch (err: any) {
      expect(err.message).toBe('LAST_OWNER_CANNOT_DEMOTE');
    }
  });

  it('harus menolak penghapusan owner satu-satunya (LAST_OWNER_CANNOT_REMOVE)', async () => {
    // Member saat ini adalah owner
    prisma.organizerMember.findUnique.mockResolvedValue({
      id: 'member-owner-1',
      organizerId: 'org-1',
      role: 'owner',
      status: 'active',
    });

    // Tidak ada owner lain selain member ini
    prisma.organizerMember.count.mockResolvedValue(0);

    await expect(
      service.removeMember('member-owner-1', 'user-owner-1'),
    ).rejects.toThrow(ConflictException);

    try {
      await service.removeMember('member-owner-1', 'user-owner-1');
    } catch (err: any) {
      expect(err.message).toBe('LAST_OWNER_CANNOT_REMOVE');
    }
  });

  it('mengizinkan perubahan role owner jika masih ada owner aktif lain', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue({
      id: 'member-owner-1',
      organizerId: 'org-1',
      role: 'owner',
      status: 'active',
    });

    // Masih ada 1 owner lain
    prisma.organizerMember.count.mockResolvedValue(1);
    prisma.organizerMember.update.mockResolvedValue({
      id: 'member-owner-1',
      role: 'admin',
    });

    const result = await service.updateRole('member-owner-1', 'admin', 'user-owner-1');
    expect(result.role).toBe('admin');
    expect(prisma.organizerMember.update).toHaveBeenCalledWith({
      where: { id: 'member-owner-1' },
      data: { role: 'admin' },
    });
  });
});
