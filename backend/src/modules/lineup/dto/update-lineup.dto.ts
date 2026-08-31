import { PartialType } from '@nestjs/swagger';
import { CreateLineupDto } from './create-lineup.dto';

export class UpdateLineupDto extends PartialType(CreateLineupDto) {}
