import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDTO {
  @ApiProperty()
  locale: string;
}
