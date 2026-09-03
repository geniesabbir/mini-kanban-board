import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  async create(
    @GetUser('id') userId: string,
    @Body() createBoardDto: CreateBoardDto,
  ) {
    return this.boardsService.create(userId, createBoardDto);
  }

  @Get()
  async findAll(@GetUser('id') userId: string) {
    return this.boardsService.findAllForUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.boardsService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, userId, updateBoardDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.boardsService.remove(id, userId);
  }

  // Members / Sharing endpoints
  @Get(':id/members')
  async getMembers(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.boardsService.getMembers(id, userId);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.boardsService.addMember(id, userId, addMemberDto);
  }

  @Patch(':id/members/:memberId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.boardsService.updateMemberRole(id, userId, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @GetUser('id') userId: string,
  ) {
    return this.boardsService.removeMember(id, userId, memberId);
  }
}
