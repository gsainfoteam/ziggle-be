import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
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
import { JwtGuard, JwtOptionalGuard } from './guard/jwt.guard';
import ms, { StringValue } from 'ms';
import { CustomConfigService } from '@lib/custom-config';

@ApiTags('user')
@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
  private readonly refreshTokenExpire: number;
  constructor(
    private readonly userService: UserService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.refreshTokenExpire = ms(
      customConfigService.REFRESH_TOKEN_EXPIRE as StringValue,
    );
  }

  @ApiOperation({
    summary: 'Login',
    description: 'Issue ziggle JWT token',
  })
  @ApiOkResponse({ description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
  @Post('login')
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JwtToken> {
    const auth = req.headers['authorization'];
    if (!auth) throw new UnauthorizedException();
    const { access_token, refresh_token, consent_required } =
      await this.userService.login(auth);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + this.refreshTokenExpire),
      path: '/user',
    });
    return { access_token, consent_required };
  }

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
    console.log(refreshToken);
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
  @ApiBearerAuth('jwt')
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies['refresh_token'];
    res.clearCookie('refresh_token');
    return this.userService.logout(refreshToken);
  }

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
