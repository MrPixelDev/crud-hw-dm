import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveFilePayloadDto {
  constructor(path: string) {
    this.path = path;
  }
  @ApiProperty({
    example: '/profiles/avatars/123',
  })
  @IsString()
  @IsNotEmpty()
  readonly path!: string;
}
