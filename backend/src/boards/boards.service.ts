import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Role } from '@prisma/client';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async validateBoardAccess(
    boardId: string,
    userId: string,
    allowedRoles?: Role[],
  ) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    let effectiveRole: Role | null = null;
    if (board.ownerId === userId) {
      effectiveRole = Role.OWNER;
    } else {
      const membership = board.members.find((m) => m.userId === userId);
      if (membership) {
        effectiveRole = membership.role;
      }
    }

    if (!effectiveRole) {
      throw new ForbiddenException('You do not have access to this board');
    }

    if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
      throw new ForbiddenException(
        'You have read-only access (Viewer) and cannot modify this board',
      );
    }

    return { board, role: effectiveRole };
  }

  async create(userId: string, dto: CreateBoardDto) {
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim(),
          ownerId: userId,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      // Automatically create 3 default columns for convenient Kanban workflow
      await tx.column.createMany({
        data: [
          { boardId: board.id, title: 'To Do', order: 0 },
          { boardId: board.id, title: 'In Progress', order: 1 },
          { boardId: board.id, title: 'Done', order: 2 },
        ],
      });

      return tx.board.findUnique({
        where: { id: board.id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          columns: {
            orderBy: { order: 'asc' },
            include: { tasks: { orderBy: { order: 'asc' } } },
          },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    });
  }

  async findAllForUser(userId: string) {
    const boards = await this.prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        columns: {
          select: {
            id: true,
            _count: { select: { tasks: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return boards.map((b) => {
      let role: Role = Role.VIEWER;
      if (b.ownerId === userId) {
        role = Role.OWNER;
      } else {
        const mem = b.members.find((m) => m.userId === userId);
        if (mem) role = mem.role;
      }

      const totalTasks = b.columns.reduce(
        (acc, col) => acc + col._count.tasks,
        0,
      );

      return {
        id: b.id,
        title: b.title,
        description: b.description,
        isOwner: b.ownerId === userId,
        currentUserRole: role,
        owner: b.owner,
        membersCount: b.members.length,
        columnsCount: b.columns.length,
        totalTasks,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });
  }

  async findOne(boardId: string, userId: string) {
    const { role } = await this.validateBoardAccess(boardId, userId);

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    return {
      ...board,
      currentUserRole: role,
      isOwner: board.ownerId === userId,
    };
  }

  async update(boardId: string, userId: string, dto: UpdateBoardDto) {
    // Only OWNER or EDITOR can edit board settings
    await this.validateBoardAccess(boardId, userId, [Role.OWNER, Role.EDITOR]);

    return this.prisma.board.update({
      where: { id: boardId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
      },
    });
  }

  async remove(boardId: string, userId: string) {
    // Only the board OWNER can delete a board
    await this.validateBoardAccess(boardId, userId, [Role.OWNER]);

    await this.prisma.board.delete({
      where: { id: boardId },
    });

    return { success: true, message: 'Board deleted successfully' };
  }

  // Collaboration / Member Management
  async getMembers(boardId: string, userId: string) {
    await this.validateBoardAccess(boardId, userId);

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return {
      owner: board.owner,
      members: board.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
    };
  }

  async addMember(boardId: string, currentUserId: string, dto: AddMemberDto) {
    // Only the OWNER can share or add members
    await this.validateBoardAccess(boardId, currentUserId, [Role.OWNER]);

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!targetUser) {
      throw new NotFoundException(
        `User with email "${dto.email}" is not registered yet.`,
      );
    }

    if (targetUser.id === currentUserId) {
      throw new BadRequestException('You are already the owner of this board');
    }

    const existingMembership = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('This user is already a collaborator on this board');
    }

    const member = await this.prisma.boardMember.create({
      data: {
        boardId,
        userId: targetUser.id,
        role: dto.role || Role.EDITOR,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return member;
  }

  async updateMemberRole(
    boardId: string,
    currentUserId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // Only board OWNER can change roles
    await this.validateBoardAccess(boardId, currentUserId, [Role.OWNER]);

    const member = await this.prisma.boardMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Member record not found on this board');
    }

    return this.prisma.boardMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeMember(
    boardId: string,
    currentUserId: string,
    memberId: string,
  ) {
    const member = await this.prisma.boardMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Member not found');
    }

    // Allowed if current user is board OWNER OR the member removing themselves
    const { role } = await this.validateBoardAccess(boardId, currentUserId);
    if (role !== Role.OWNER && member.userId !== currentUserId) {
      throw new ForbiddenException('Only the board owner can remove members');
    }

    await this.prisma.boardMember.delete({
      where: { id: memberId },
    });

    return { success: true, message: 'Member removed from board' };
  }
}
