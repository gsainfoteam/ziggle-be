import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class IdPGuard extends AuthGuard('idp') {}

@Injectable()
export class IdPOptionalGuard extends AuthGuard([
  'idp-optional',
  'anonymous',
]) {}
