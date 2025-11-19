import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from './decorator/get-user.decorator';
import { UserInfoRes } from './dto/res/userInfoRes.dto';
import { setFcmTokenRes } from './dto/res/setFcmTokenRes.dto';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { JwtGuard, JwtOptionalGuard } from '../auth/guard/jwt.guard';

@ApiTags('user')
@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'post consent',
    description: 'post consent to the user',
  })
  @ApiCreatedResponse({ description: 'update consent true' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiBearerAuth('jwt')
  @Post('consent')
  @UseGuards(JwtGuard)
  async setConsent(@GetUser() user: User): Promise<void> {
    return this.userService.setConsent(user);
  }

  @ApiOperation({
    summary: 'get user info',
    description: 'get user info',
  })
  @ApiOkResponse({ type: UserInfoRes, description: 'Return user info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiBearerAuth('jwt')
  @Get('info')
  @UseGuards(JwtGuard)
  async getUserInfo(@GetUser() user: User): Promise<UserInfoRes> {
    return user;
  }

  @ApiOperation({
    summary: 'create or update FCM token',
    description: 'create or update FCM token',
  })
  @ApiOkResponse({ type: setFcmTokenRes, description: 'Return FCM token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiBearerAuth('jwt')
  @Post('fcm')
  @UseGuards(JwtOptionalGuard)
  async setFcmToken(@GetUser() user: User, @Body() fcmToken: setFcmTokenReq) {
    return this.userService.setFcmToken(user?.uuid, fcmToken);
  }

  @ApiOperation({
    summary: 'delete user',
    description: 'delete user and all data related to the user',
  })
  @ApiCreatedResponse({ description: 'user deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiBearerAuth('jwt')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async deleteUser(@GetUser() user: User): Promise<void> {
    await this.userService.deleteUser(user);
  }
}
