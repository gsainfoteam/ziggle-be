import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class jwtGuard extends AuthGuard('jwt') {}

@Injectable()
export class jwtOptionalGuard extends AuthGuard([
  'jwt-optional',
  'anonymous',
]) {}
