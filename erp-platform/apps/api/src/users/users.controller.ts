import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
  }

  @Post()
  async createUser(@Body() body: any) {
    const { name, email, password, role } = body;
    const hash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        tenantId: 'default-tenant',
        name,
        email,
        password: hash,
        role: role || 'CASHIER'
      }
    });
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (body.role) data.role = body.role;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
