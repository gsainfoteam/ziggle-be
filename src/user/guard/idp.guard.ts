import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class IdPGuard extends AuthGuard('gistory-idp') {}

@Injectable()
export class IdPOptionalGuard extends AuthGuard([
  'gistory-idp-optional',
  'anonymous',
]) {}
