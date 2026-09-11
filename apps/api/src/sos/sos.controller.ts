import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { type CreateSosDto, CreateSosSchema } from './dto/create-sos.dto';
import { type EstimateDonorsDto, EstimateDonorsSchema } from './dto/estimate-donors.dto';
import {
  type NearbyHospitalsQueryDto,
  NearbyHospitalsQuerySchema,
} from './dto/nearby-hospitals-query.dto';
import { type NearbySosQueryDto, NearbySosQuerySchema } from './dto/nearby-sos-query.dto';
import { SosService } from './sos.service';

@ApiTags('SOS')
@ApiBearerAuth()
@Controller('sos')
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une alerte SOS de don de sang' })
  async create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(CreateSosSchema)) dto: CreateSosDto,
  ): Promise<ReturnType<SosService['create']>> {
    return this.sosService.create(user.id, dto);
  }

  @Get('estimate')
  @ApiOperation({ summary: 'Estimer le vivier de donneurs compatibles disponibles' })
  async estimateDonors(
    @Query(new ZodValidationPipe(EstimateDonorsSchema)) query: EstimateDonorsDto,
  ): Promise<ReturnType<SosService['estimateDonors']>> {
    return this.sosService.estimateDonors(query.bloodTypeNeeded, query.city);
  }

  @Get('active')
  @ApiOperation({ summary: 'Récupérer le SOS actif du demandeur ou en cours pour un donneur' })
  async getActive(
    @CurrentUser() user: JwtUser,
  ): Promise<ReturnType<SosService['getActiveForUser']>> {
    return this.sosService.getActiveForUser(user.id);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Récupérer les SOS créés par l’utilisateur connecté' })
  async getMine(@CurrentUser() user: JwtUser): Promise<ReturnType<SosService['getMine']>> {
    return this.sosService.getMine(user.id);
  }

  @Get('hospitals/nearby')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Rechercher les hôpitaux les plus proches par coordonnées GPS' })
  async getNearbyHospitals(
    @Query(new ZodValidationPipe(NearbyHospitalsQuerySchema)) query: NearbyHospitalsQueryDto,
  ): Promise<ReturnType<SosService['getNearbyHospitals']>> {
    return this.sosService.getNearbyHospitals(query.lat, query.lon);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Lister les alertes SOS compatibles pour un donneur (flux Explorer)' })
  async getNearby(
    @CurrentUser() user: JwtUser,
    @Query(new ZodValidationPipe(NearbySosQuerySchema)) query: NearbySosQueryDto,
  ): Promise<ReturnType<SosService['getNearby']>> {
    return this.sosService.getNearby(
      query.city,
      query.bloodType as Parameters<SosService['getNearby']>[1],
      user.id,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir la fiche détaillée d’un SOS par son ID' })
  async getById(@Param('id') id: string): Promise<ReturnType<SosService['getById']>> {
    return this.sosService.getById(id);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Clôturer manuellement une alerte SOS par le demandeur' })
  async close(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ): Promise<ReturnType<SosService['close']>> {
    return this.sosService.close(user.id, id);
  }
}
