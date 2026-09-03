import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;
  let boardsService: BoardsService;

  const mockPrisma: any = {
    task: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    column: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockBoardsService = {
    validateBoardAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BoardsService, useValue: mockBoardsService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
    boardsService = module.get<BoardsService>(BoardsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('move', () => {
    it('should throw NotFoundException if task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.move('t-nonexistent', 'u-1', {
          targetColumnId: 'col-2',
          targetOrder: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if target column is in a different board (cross-board prevention)', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 't-1',
        columnId: 'col-1',
        column: { id: 'col-1', boardId: 'board-A' },
      });

      mockPrisma.column.findUnique.mockResolvedValueOnce({
        id: 'col-target',
        boardId: 'board-B', // Different board!
      });

      await expect(
        service.move('t-1', 'u-1', {
          targetColumnId: 'col-target',
          targetOrder: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reorder tasks within the same column inside a transaction', async () => {
      const task = {
        id: 't-1',
        columnId: 'col-1',
        column: { id: 'col-1', boardId: 'board-A' },
      };

      mockPrisma.task.findUnique.mockResolvedValueOnce(task);
      mockPrisma.column.findUnique.mockResolvedValueOnce({
        id: 'col-1',
        boardId: 'board-A',
      });
      mockBoardsService.validateBoardAccess.mockResolvedValueOnce({ role: Role.OWNER });

      // Simulate $transaction callback
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          task: {
            findMany: jest.fn().mockResolvedValue([
              { id: 't-0', order: 0 },
              { id: 't-1', order: 1 },
              { id: 't-2', order: 2 },
            ]),
            update: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue({
              id: 't-1',
              columnId: 'col-1',
              order: 0,
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.move('t-1', 'u-1', {
        targetColumnId: 'col-1',
        targetOrder: 0, // Move from index 1 to index 0
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('t-1');
    });

    it('should move task across different columns inside a transaction', async () => {
      const task = {
        id: 't-1',
        columnId: 'col-1',
        column: { id: 'col-1', boardId: 'board-A' },
      };

      mockPrisma.task.findUnique.mockResolvedValueOnce(task);
      mockPrisma.column.findUnique.mockResolvedValueOnce({
        id: 'col-2',
        boardId: 'board-A',
      });
      mockBoardsService.validateBoardAccess.mockResolvedValueOnce({ role: Role.OWNER });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          task: {
            findMany: jest
              .fn()
              .mockResolvedValueOnce([{ id: 't-0', order: 0 }]) // source column remaining
              .mockResolvedValueOnce([{ id: 't-target-0', order: 0 }]), // target column tasks
            update: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue({
              id: 't-1',
              columnId: 'col-2',
              order: 1,
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.move('t-1', 'u-1', {
        targetColumnId: 'col-2',
        targetOrder: 1,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.columnId).toBe('col-2');
    });
  });
});
