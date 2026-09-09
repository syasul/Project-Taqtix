import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from './tokens.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('TokensService', () => {
  let service: TokensService;
  let prisma: any;

  const mockPrisma = {
    organizerMember: { findFirst: jest.fn() },
    organizer: { findUnique: jest.fn() },
    apiToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate token starting with taq_live_, store sha256 hash, and return tokenPreview with last 8 chars', async () => {
      mockPrisma.organizerMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: 'owner',
        organizer: { id: 'org-1' },
      });

      mockPrisma.apiToken.create.mockImplementation(({ data }: any) => ({
        id: 'token-id-1',
        name: data.name,
        tokenPreview: data.tokenPreview,
        scopes: data.scopes,
        createdAt: new Date(),
      }));

      const result = await service.generateToken(
        { name: 'Zapier Integration' },
        'user-owner-1',
      );

      expect(result.token).toMatch(/^taq_live_[a-f0-9]{48}$/);
      expect(result.tokenPreview).toBe(`...${result.token.slice(-8)}`);
      expect(mockPrisma.apiToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenHash: expect.any(String),
            tokenPreview: `...${result.token.slice(-8)}`,
          }),
        }),
      );
    });

    it('should forbid non-owner organizer members from generating api tokens', async () => {
      mockPrisma.organizerMember.findFirst.mockResolvedValue({
        id: 'member-marketing',
        role: 'marketing',
        organizer: { id: 'org-1' },
      });

      await expect(
        service.generateToken({ name: 'Test' }, 'user-marketing-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateApiKey', () => {
    it('should validate apiKey by comparing sha256 hash', async () => {
      const plainKey = 'taq_live_abc1234567890abcdef1234567890';
      const expectedHash = crypto.createHash('sha256').update(plainKey).digest('hex');

      mockPrisma.apiToken.findFirst.mockResolvedValue({
        id: 'tok-1',
        tokenHash: expectedHash,
        revokedAt: null,
        organizer: { id: 'org-1', name: 'Fest Org' },
      });

      const tokenRecord = await service.validateApiKey(plainKey);
      expect(tokenRecord).toBeDefined();
      expect(tokenRecord?.id).toBe('tok-1');
      expect(mockPrisma.apiToken.findFirst).toHaveBeenCalledWith({
        where: {
          tokenHash: expectedHash,
          revokedAt: null,
        },
        include: { organizer: true },
      });
    });
  });
});
