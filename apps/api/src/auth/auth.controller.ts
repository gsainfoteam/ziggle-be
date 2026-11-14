import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtToken } from './dto/res/jwtToken.dto';
import { AuthService } from './auth.service';
import {
  ApiBadGatewayResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginReq, SessionReq } from './dto/req/sessionReq.dto';
import ms, { StringValue } from 'ms';
import { CustomConfigService } from '@lib/custom-config';

@ApiTags('auth')
@Controller('auth')
@UsePipes(ValidationPipe)
export class AuthController {
  private readonly refreshTokenExpire: number;
  private readonly cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/auth',
  } as const;
  constructor(
    private readonly authService: AuthService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.refreshTokenExpire = ms(
      customConfigService.REFRESH_TOKEN_EXPIRE as StringValue,
    );
  }

  @ApiOperation({
    summary: 'Login',
    description:
      'Exchange the IdP authorization code and issue ziggle JWT token',
  })
  @ApiOkResponse({ type: JwtToken, description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadGatewayResponse({ description: 'IdP unavailable' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginReq = {} as LoginReq,
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JwtToken> {
    if (body.code === undefined && !authorization)
      throw new BadRequestException();
    const { access_token, refresh_token } =
      body.code === undefined
        ? await this.authService.loginWithIdpToken(authorization!)
        : await this.authService.login(body);
    if (body.transport === 'body') return { access_token, refresh_token };
    res.cookie('refresh_token', refresh_token, {
      ...this.cookieOptions,
      expires: new Date(Date.now() + this.refreshTokenExpire),
    });
    return { access_token };
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh the access token from idp',
  })
  @ApiCreatedResponse({ type: JwtToken, description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(
    @Req() req: Request,
    @Body() body: SessionReq = {},
  ): Promise<JwtToken> {
    const refreshToken = this.refreshTokenOf(req, body);
    if (!refreshToken) throw new UnauthorizedException();
    const { access_token, refresh_token } =
      await this.authService.refresh(refreshToken);
    return body.transport === 'body'
      ? { access_token, refresh_token }
      : { access_token };
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Logout the user from the cookie and idp',
  })
  @ApiCreatedResponse({ description: 'Logged out' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Body() body: SessionReq = {},
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = this.refreshTokenOf(req, body);
    res.clearCookie('refresh_token', this.cookieOptions);
    if (refreshToken) await this.authService.logout(refreshToken);
  }

  private refreshTokenOf(req: Request, body: SessionReq): string | undefined {
    return body.transport === 'body'
      ? body.refresh_token
      : req.cookies['refresh_token'];
  }
}
