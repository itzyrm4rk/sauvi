import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: "Vérifier l'état de santé de l'API" })
  async getHealth(): Promise<{
    data: { status: string; database: string; redis: string };
  }> {
    return { data: await this.appService.getHealth() };
  }
}
