import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtToken } from './type/jwt.type';
import { IdPGuard, IdPOptionalGuard } from './guard/idp.guard';
import { UserInfo } from './type/userInfo.type';
import { LoginDto } from './dto/login.dto';
import { GetUser } from './decorator/get-user.decorator';
import { User } from 'src/global/entity/user.entity';
import { GetIdPUser } from './decorator/get-idp-user.decorator';
import { Request, Response } from 'express';

@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('login')
  async loginByIdP(
    @Query() authCode: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('type') type?: 'web' | 'local' | 'flutter',
  ): Promise<Omit<JwtToken, 'refresh_token'>> {
    const { refresh_token, ...token } = await this.userService.login(
      authCode,
      type ??
        ((req.headers['user-agent'] as string).includes('Dart')
          ? 'flutter'
          : 'web'),
    );
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    return { ...token };
  }

  @Post('refresh')
  refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token'];
    return this.userService.refresh(refreshToken);
  }

  @Post('logout')
  logout(
    @Body('access_token') accessToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    res.clearCookie('refresh_token');
    return this.userService.logout(accessToken, refreshToken);
  }

  @Get('info')
  @UseGuards(IdPGuard)
  getUserInfo(@GetIdPUser() user: UserInfo): UserInfo {
    return user;
  }

  @Post('fcm')
  @UseGuards(IdPOptionalGuard)
  setFcmToken(@GetUser() user: User, @Body('fcm_token') fcmToken: string) {
    return this.userService.setFcmToken(user?.uuid, fcmToken);
  }

  @Post('consent')
  @UseGuards(IdPGuard)
  @HttpCode(201)
  async setConsent(@GetUser() user: User) {
    await this.userService.setConsent(user);
    return '';
  }
}
