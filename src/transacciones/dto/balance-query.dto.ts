import { IsDateString, IsOptional } from 'class-validator';

export class BalanceQueryDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
