import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnDto } from './dto/reorder-column.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ColumnsService {
  constructor(
    private prisma: PrismaService,
    private boardsService: BoardsService,
  ) {}

  async create(userId: string, dto: CreateColumnDto) {
    // Check permission to modify the board
    await this.boardsService.validateBoardAccess(dto.boardId, userId, [
      Role.OWNER,
      Role.EDITOR,
    ]);

    // Find highest order in the board
    const maxOrderCol = await this.prisma.column.findFirst({
      where: { boardId: dto.boardId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = maxOrderCol ? maxOrderCol.order + 1 : 0;

    return this.prisma.column.create({
      data: {
        boardId: dto.boardId,
        title: dto.title.trim(),
        order: nextOrder,
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async update(columnId: string, userId: string, dto: UpdateColumnDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.validateBoardAccess(column.boardId, userId, [
      Role.OWNER,
      Role.EDITOR,
    ]);

    return this.prisma.column.update({
      where: { id: columnId },
      data: {
        title: dto.title.trim(),
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async reorder(columnId: string, userId: string, dto: ReorderColumnDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.validateBoardAccess(column.boardId, userId, [
      Role.OWNER,
      Role.EDITOR,
    ]);

    return this.prisma.$transaction(async (tx) => {
      const allCols = await tx.column.findMany({
        where: { boardId: column.boardId },
        orderBy: { order: 'asc' },
      });

      const filtered = allCols.filter((c) => c.id !== columnId);
      const targetIndex = Math.max(0, Math.min(dto.order, filtered.length));
      filtered.splice(targetIndex, 0, column);

      for (let i = 0; i < filtered.length; i++) {
        await tx.column.update({
          where: { id: filtered[i].id },
          data: { order: i },
        });
      }

      return tx.board.findUnique({
        where: { id: column.boardId },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: { tasks: { orderBy: { order: 'asc' } } },
          },
        },
      });
    });
  }

  async remove(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.validateBoardAccess(column.boardId, userId, [
      Role.OWNER,
      Role.EDITOR,
    ]);

    await this.prisma.column.delete({
      where: { id: columnId },
    });

    return { success: true, message: 'Column deleted successfully' };
  }
}
