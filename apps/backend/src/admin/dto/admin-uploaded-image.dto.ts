import { ApiProperty } from '@nestjs/swagger';

export class AdminUploadedImageDto {
  @ApiProperty()
  filename!: string;

  @ApiProperty()
  url!: string;
}
