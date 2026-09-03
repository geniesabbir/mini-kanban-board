import { Test, TestingModule } from '@nestjs/testing';
import { BoardsService } from './boards.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('BoardsService', () => {
  let service: BoardsService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    board: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    boardMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    column: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('validateBoardAccess', () => {
    it('should grant access to board OWNER', async () => {
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        ownerId: 'user-alice',
        members: [],
      });

      const { role } = await service.validateBoardAccess('b-1', 'user-alice');
      expect(role).toBe(Role.OWNER);
    });

    it('should grant access to board member with their assigned role', async () => {
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        ownerId: 'user-alice',
        members: [{ userId: 'user-bob', role: Role.EDITOR }],
      });

      const { role } = await service.validateBoardAccess('b-1', 'user-bob');
      expect(role).toBe(Role.EDITOR);
    });

    it('should throw ForbiddenException if user has no relation to board', async () => {
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        ownerId: 'user-alice',
        members: [{ userId: 'user-bob', role: Role.EDITOR }],
      });

      await expect(
        service.validateBoardAccess('b-1', 'user-intruder'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject VIEWER role if operation requires [OWNER, EDITOR]', async () => {
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        ownerId: 'user-alice',
        members: [{ userId: 'user-viewer', role: Role.VIEWER }],
      });

      await expect(
        service.validateBoardAccess('b-1', 'user-viewer', [Role.OWNER, Role.EDITOR]),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
