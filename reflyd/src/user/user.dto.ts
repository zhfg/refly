import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDTO {
  @ApiPropertyOptional()
  uiLocale?: string;

  @ApiPropertyOptional()
  outputLocale?: string;
}
