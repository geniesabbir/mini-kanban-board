import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { Role } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private boardsService: BoardsService,
  ) {}

  async create(userId: string, dto: CreateTaskDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: dto.columnId },
      include: { board: true },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.validateBoardAccess(column.boardId, userId, [
      Role.OWNER,
      Role.EDITOR,
    ]);

    const maxTask = await this.prisma.task.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = maxTask !== null ? maxTask.order + 1 : 0;

    return this.prisma.task.create({
      data: {
        columnId: dto.columnId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        order: nextOrder,
      },
    });
  }

  async findOne(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.boardsService.validateBoardAccess(task.column.boardId, userId);

    return task;
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.boardsService.validateBoardAccess(task.column.boardId, userId, [
      Role.OWNER,
      Role.EDITOR,
    ]);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      },
    });
  }

  async remove(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.boardsService.validateBoardAccess(task.column.boardId, userId, [
      Role.OWNER,
      Role.EDITOR,
    ]);

    await this.prisma.$transaction(async (tx) => {
      await tx.task.delete({
        where: { id: taskId },
      });

      // Compact remaining orders in the column
      const remainingTasks = await tx.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { order: 'asc' },
      });

      for (let i = 0; i < remainingTasks.length; i++) {
        await tx.task.update({
          where: { id: remainingTasks[i].id },
          data: { order: i },
        });
      }
    });

    return { success: true, message: 'Task deleted successfully' };
  }

  /**
   * Task Movement API:
   * Handles reordering within the same column and moving across columns.
   * Enforces board access authorization and ensures order consistency inside a transaction.
   */
  async move(taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const targetColumn = await this.prisma.column.findUnique({
      where: { id: dto.targetColumnId },
    });

    if (!targetColumn) {
      throw new NotFoundException('Target column not found');
    }

    // Security & Isolation: Prevent cross-board moves
    if (task.column.boardId !== targetColumn.boardId) {
      throw new BadRequestException('Cannot move tasks across different boards');
    }

    // Check user permission on the board
    await this.boardsService.validateBoardAccess(
      task.column.boardId,
      userId,
      [Role.OWNER, Role.EDITOR],
    );

    const sourceColumnId = task.columnId;
    const targetColumnId = dto.targetColumnId;

    return this.prisma.$transaction(async (tx) => {
      if (sourceColumnId === targetColumnId) {
        // Reordering within the SAME column
        const columnTasks = await tx.task.findMany({
          where: { columnId: sourceColumnId },
          orderBy: { order: 'asc' },
        });

        // Filter out moving task
        const otherTasks = columnTasks.filter((t) => t.id !== taskId);
        const clampedIndex = Math.max(
          0,
          Math.min(dto.targetOrder, otherTasks.length),
        );

        otherTasks.splice(clampedIndex, 0, task);

        // Update all tasks with guaranteed continuous order
        for (let i = 0; i < otherTasks.length; i++) {
          await tx.task.update({
            where: { id: otherTasks[i].id },
            data: { order: i },
          });
        }
      } else {
        // Moving ACROSS DIFFERENT columns
        // 1. Re-index source column
        const sourceRemainingTasks = await tx.task.findMany({
          where: {
            columnId: sourceColumnId,
            id: { not: taskId },
          },
          orderBy: { order: 'asc' },
        });

        for (let i = 0; i < sourceRemainingTasks.length; i++) {
          await tx.task.update({
            where: { id: sourceRemainingTasks[i].id },
            data: { order: i },
          });
        }

        // 2. Insert into target column
        const targetTasks = await tx.task.findMany({
          where: { columnId: targetColumnId },
          orderBy: { order: 'asc' },
        });

        const clampedIndex = Math.max(
          0,
          Math.min(dto.targetOrder, targetTasks.length),
        );

        targetTasks.splice(clampedIndex, 0, task);

        for (let i = 0; i < targetTasks.length; i++) {
          if (targetTasks[i].id === taskId) {
            await tx.task.update({
              where: { id: taskId },
              data: {
                columnId: targetColumnId,
                order: i,
              },
            });
          } else {
            await tx.task.update({
              where: { id: targetTasks[i].id },
              data: { order: i },
            });
          }
        }
      }

      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          column: {
            select: { id: true, title: true, boardId: true },
          },
        },
      });
    });
  }
}
