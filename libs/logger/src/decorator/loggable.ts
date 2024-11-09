import { SetMetadata } from '@nestjs/common';

export const LOGGABLE = Symbol('LOGGABLE');
export const Loggable = () => SetMetadata(LOGGABLE, true);
