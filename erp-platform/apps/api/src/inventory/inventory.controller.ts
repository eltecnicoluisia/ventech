import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  private tid(h: string) { return h || 'default-tenant'; }

  // ─── PRODUCTOS ────────────────────────────────────────────────────────────

  @Get('products')
  getProducts(@Headers('x-tenant-id') t: string) {
    return this.inventoryService.getProducts(this.tid(t));
  }

  @Post('products')
  createProduct(@Headers('x-tenant-id') t: string, @Body() data: any) {
    return this.inventoryService.createProduct(this.tid(t), data);
  }

  @Patch('products/:id')
  updateProduct(@Headers('x-tenant-id') t: string, @Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateProduct(this.tid(t), id, data);
  }

  @Delete('products/:id')
  deleteProduct(@Headers('x-tenant-id') t: string, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(this.tid(t), id);
  }

  // ─── CATEGORÍAS ───────────────────────────────────────────────────────────

  @Get('categories')
  getCategories(@Headers('x-tenant-id') t: string) {
    return this.inventoryService.getCategories(this.tid(t));
  }

  @Post('categories')
  createCategory(@Headers('x-tenant-id') t: string, @Body() body: { name: string; icon?: string; attributes?: any }) {
    return this.inventoryService.createCategory(this.tid(t), body.name, body.icon, body.attributes);
  }

  @Delete('categories/:id')
  deleteCategory(@Headers('x-tenant-id') t: string, @Param('id') id: string) {
    return this.inventoryService.deleteCategory(this.tid(t), id);
  }

  @Patch('categories/:id')
  updateCategory(@Headers('x-tenant-id') t: string, @Param('id') id: string, @Body() body: { name: string; attributes?: any }) {
    return this.inventoryService.updateCategory(this.tid(t), id, body.name, body.attributes);
  }

  // ─── TIPOS ────────────────────────────────────────────────────────────────

  @Get('types')
  getProductTypes(@Headers('x-tenant-id') t: string) {
    return this.inventoryService.getProductTypes(this.tid(t));
  }

  @Post('types')
  createProductType(@Headers('x-tenant-id') t: string, @Body() body: { name: string }) {
    return this.inventoryService.createProductType(this.tid(t), body.name);
  }

  @Delete('types/:id')
  deleteProductType(@Headers('x-tenant-id') t: string, @Param('id') id: string) {
    return this.inventoryService.deleteProductType(this.tid(t), id);
  }

  @Patch('types/:id')
  updateProductType(@Headers('x-tenant-id') t: string, @Param('id') id: string, @Body() body: { name: string }) {
    return this.inventoryService.updateProductType(this.tid(t), id, body.name);
  }

  // ─── CLIENTES ─────────────────────────────────────────────────────────────

  @Get('customers')
  getCustomers(@Headers('x-tenant-id') t: string) {
    return this.inventoryService.getCustomers(this.tid(t));
  }

  @Post('customers')
  createCustomer(@Headers('x-tenant-id') t: string, @Body() data: any) {
    return this.inventoryService.createCustomer(this.tid(t), data);
  }

  @Patch('customers/:id')
  updateCustomer(@Headers('x-tenant-id') t: string, @Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateCustomer(this.tid(t), id, data);
  }

  @Delete('customers/:id')
  deleteCustomer(@Headers('x-tenant-id') t: string, @Param('id') id: string) {
    return this.inventoryService.deleteCustomer(this.tid(t), id);
  }

  // ─── SEED ─────────────────────────────────────────────────────────────────

  @Post('seed-defaults')
  seedDefaults(@Headers('x-tenant-id') t: string) {
    return this.inventoryService.seedDefaults(this.tid(t));
  }
}
