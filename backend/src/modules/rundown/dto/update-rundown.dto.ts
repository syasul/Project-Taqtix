import { PartialType } from '@nestjs/swagger';
import { CreateRundownDto } from './create-rundown.dto';

export class UpdateRundownDto extends PartialType(CreateRundownDto) {}

