import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtOptionalGuard extends AuthGuard([
  'jwt-optional',
  'anonymous',
]) {}
