import { Controller, Get } from '@nestjs/common';
import { Logger } from '@nestjs/common';
@Controller()
export class AppController {
  private logger = new Logger(AppController.name);

  @Get()
  findAll() {
    this.logger.log('hello');
    return { message: 'Refly API Endpoint', version: 'v1' };
  }
}
