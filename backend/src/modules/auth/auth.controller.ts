import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser, Public } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordDto } from './dto';

const COOKIE = 'mf_refresh';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  private setCookie(res: Response, token: string) {
    res.cookie(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 864e5,
      path: '/',
    });
  }

  @Public() @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const out = await this.auth.register(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
    this.setCookie(res, out.refreshToken);
    return out;
  }

  @Public() @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const out = await this.auth.login(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
    this.setCookie(res, out.refreshToken);
    return out;
  }

  @Public() @Post('refresh')
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = dto.refreshToken || req.cookies?.[COOKIE];
    const out = await this.auth.refresh(raw, { ip: req.ip, userAgent: req.headers['user-agent'] });
    this.setCookie(res, out.refreshToken);
    return out;
  }

  @Public() @Post('logout')
  async logout(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, { path: '/' });
    return this.auth.logout(dto.refreshToken || req.cookies?.[COOKIE]);
  }

  @Public() @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto); }

  @Public() @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto); }

  @Public() @Get('verify-email')
  verify(@Query('token') token: string) { return this.auth.verifyEmail(token); }

  @UseGuards(JwtAuthGuard) @Get('me')
  me(@CurrentUser('id') userId: string) { return this.auth.me(userId); }

  @UseGuards(JwtAuthGuard) @Post('change-password')
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(userId, dto);
  }
}
