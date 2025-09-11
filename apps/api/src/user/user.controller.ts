import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtToken } from './dto/res/jwtToken.dto';
import { UserService } from './user.service';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LogoutDto } from './dto/req/logout.dto';
import { IdPGuard, IdPOptionalGuard } from './guard/idp.guard';
import { User } from '@prisma/client';
import { GetUser } from './decorator/get-user.decorator';
import { UserInfoRes } from './dto/res/userInfoRes.dto';
import { GetIdPUser } from './decorator/get-idp-user.decorator';
import { setFcmTokenRes } from './dto/res/setFcmTokenRes.dto';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';

@ApiTags('user')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh the access token from idp',
  })
  @ApiCreatedResponse({ type: JwtToken, description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JwtToken> {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();
    const { refresh_token, ...token } =
      await this.userService.refresh(refreshToken);
    if (refresh_token) {
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });
    }
    return { ...token };
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Logout the user from the cookie and idp',
  })
  @ApiCreatedResponse({ description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('logout')
  async logout(
    @Body() { access_token }: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();
    res.clearCookie('refresh_token');
    return this.userService.logout(access_token, refreshToken);
  }

  @ApiOperation({
    summary: 'post consent',
    description: 'post consent to the user',
  })
  @ApiCreatedResponse({ description: 'update consent true' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('consent')
  @UseGuards(IdPGuard)
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
  @Get('info')
  @UseGuards(IdPGuard)
  async getUserInfo(@GetIdPUser() user: UserInfo): Promise<UserInfoRes> {
    return user;
  }

  @ApiOperation({
    summary: 'create or update FCM token',
    description: 'create or update FCM token',
  })
  @ApiOkResponse({ type: setFcmTokenRes, description: 'Return FCM token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('fcm')
  @UseGuards(IdPOptionalGuard)
  async setFcmToken(@GetUser() user: User, @Body() fcmToken: setFcmTokenReq) {
    return this.userService.setFcmToken(user?.uuid, fcmToken);
  }
}
