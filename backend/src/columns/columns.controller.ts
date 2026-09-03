import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnDto } from './dto/reorder-column.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  async create(
    @GetUser('id') userId: string,
    @Body() createColumnDto: CreateColumnDto,
  ) {
    return this.columnsService.create(userId, createColumnDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateColumnDto: UpdateColumnDto,
  ) {
    return this.columnsService.update(id, userId, updateColumnDto);
  }

  @Patch(':id/reorder')
  async reorder(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() reorderColumnDto: ReorderColumnDto,
  ) {
    return this.columnsService.reorder(id, userId, reorderColumnDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.columnsService.remove(id, userId);
  }
}
