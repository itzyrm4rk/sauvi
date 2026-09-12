import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Accueil et statut de l'API SAUVI" })
  getRoot() {
    return {
      name: 'SAUVI API',
      status: 'online',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/api/health',
    };
  }

  @Get('health')
  @ApiOperation({ summary: "Vérifier l'état de santé de l'API" })
  async getHealth(): Promise<{
    data: { status: string; database: string; redis: string };
  }> {
    return { data: await this.appService.getHealth() };
  }
}
