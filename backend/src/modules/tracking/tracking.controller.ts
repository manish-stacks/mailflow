import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '@/common/decorators';
import { PIXEL, TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private svc: TrackingService) {}

  @Public() @Get('open/:token')
  async open(@Param('token') token: string, @Req() req: Request, @Res() res: Response) {
    // Always return the pixel, even for a bad token — never leak validity.
    this.svc.open(token, { ip: req.ip, userAgent: req.headers['user-agent'] }).catch(() => null);
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.end(PIXEL);
  }

  @Public() @Get('click/:token')
  async click(@Param('token') token: string, @Req() req: Request, @Res() res: Response) {
    const url = await this.svc.click(token, { ip: req.ip, userAgent: req.headers['user-agent'] }).catch(() => null);
    return res.redirect(302, url || `${process.env.APP_BASE_URL || 'http://localhost:3000'}/link-expired`);
  }
}
