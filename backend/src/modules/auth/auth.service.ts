import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { RefreshToken, User, Workspace, WorkspaceMember } from '@/database/entities';
import { randomToken } from '@/common/tokens';
import { EmailService } from '@/integrations/email/email.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto';

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'workspace';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(RefreshToken) private tokens: Repository<RefreshToken>,
    private jwt: JwtService,
    private config: ConfigService,
    private dataSource: DataSource,
    private email: EmailService,
  ) { }

  async register(dto: RegisterDto, ctx: { ip?: string; userAgent?: string } = {}) {
    const exists = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('An account with this email already exists');

    const verificationToken = randomToken(24);
    const user = await this.dataSource.transaction(async (m) => {
      const u = m.create(User, {
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 12),
        firstName: dto.firstName,
        lastName: dto.lastName,
        verificationToken,
      });
      await m.save(u);

      // Every new user gets a first workspace so the product is usable immediately.
      const name = dto.workspaceName?.trim() || `${dto.firstName}'s Workspace`;
      const ws = m.create(Workspace, { name, slug: `${slugify(name)}-${randomToken(3)}`, ownerId: u.id });
      await m.save(ws);
      await m.save(m.create(WorkspaceMember, { workspaceId: ws.id, userId: u.id, role: 'owner', status: 'active' }));
      return u;
    });

    this.sendVerificationEmail(user.email, verificationToken).catch((e) => this.logger.warn(e.message));
    return this.issueSession(user, ctx);
  }

  async login(dto: LoginDto, ctx: { ip?: string; userAgent?: string } = {}) {
    // console.log(await bcrypt.hash("123456", 12));
    const user = await this.users
      .createQueryBuilder('u').addSelect('u.passwordHash')
      .where('u.email = :email', { email: dto.email.toLowerCase() }).getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.users.update(user.id, { lastLoginAt: new Date() });
    return this.issueSession(user, ctx);
  }

  async refresh(rawToken: string, ctx: { ip?: string; userAgent?: string } = {}) {
    if (!rawToken) throw new UnauthorizedException('Missing refresh token');
    const record = await this.tokens.findOne({
      where: { tokenHash: hashToken(rawToken), expiresAt: MoreThan(new Date()) },
      relations: ['user'],
    });
    if (!record || record.revokedAt) throw new UnauthorizedException('Invalid refresh token');

    // Rotation: the presented token is burned and replaced.
    await this.tokens.update(record.id, { revokedAt: new Date() });
    return this.issueSession(record.user, ctx);
  }

  async logout(rawToken: string) {
    if (rawToken) await this.tokens.update({ tokenHash: hashToken(rawToken) }, { revokedAt: new Date() });
    return { message: 'Logged out' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (user) {
      const token = randomToken(24);
      await this.users.update(user.id, {
        resetToken: token,
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const url = `${this.config.get('appBaseUrl')}/reset-password?token=${token}`;
      await this.email.sendSystem(user.email, 'Reset your MailFlow password',
        `<p>Reset your password using the link below. It expires in 1 hour.</p><p><a href="${url}">${url}</a></p>`)
        .catch((e) => this.logger.warn(e.message));
    }
    // Always the same answer — no account enumeration.
    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.users.createQueryBuilder('u')
      .addSelect(['u.resetToken', 'u.resetTokenExpiresAt'])
      .where('u.resetToken = :t', { t: dto.token }).getOne();

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or expired');
    }
    await this.users.update(user.id, {
      passwordHash: await bcrypt.hash(dto.password, 12),
      resetToken: null, resetTokenExpiresAt: null,
    });
    await this.tokens.update({ userId: user.id }, { revokedAt: new Date() });
    return { message: 'Password updated' };
  }

  /** Self-service password change for a logged-in user (requires current password). */
  async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.users.createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id: userId }).getOne();
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.users.update(user.id, { passwordHash: await bcrypt.hash(dto.newPassword, 12) });
    // Log the user out everywhere else for safety.
    await this.tokens.update({ userId: user.id }, { revokedAt: new Date() });
    return { message: 'Password updated' };
  }

  async verifyEmail(token: string) {
    const user = await this.users.createQueryBuilder('u').addSelect('u.verificationToken')
      .where('u.verificationToken = :t', { t: token }).getOne();
    if (!user) throw new BadRequestException('Invalid verification token');
    await this.users.update(user.id, { emailVerified: true, verificationToken: null });
    return { message: 'Email verified' };
  }

  async me(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    const memberships = await this.dataSource.getRepository(WorkspaceMember).find({
      where: { userId, status: 'active' }, relations: ['workspace'],
    });
    return {
      user,
      workspaces: memberships.map((m) => ({
        id: m.workspaceId, name: m.workspace?.name, slug: m.workspace?.slug,
        role: m.role, status: m.workspace?.status,
      })),
    };
  }

  private async issueSession(user: User, ctx: { ip?: string; userAgent?: string }) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { secret: this.config.get('jwt.accessSecret'), expiresIn: this.config.get('jwt.accessTtl') },
    );
    const refreshToken = randomToken(48);
    const ttlDays = parseInt(this.config.get('jwt.refreshTtl'), 10) || 30;
    await this.tokens.save(this.tokens.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ttlDays * 864e5),
      ip: ctx.ip, userAgent: ctx.userAgent?.slice(0, 240),
    }));

    return {
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, emailVerified: !!user.emailVerified },
    };
  }

  private async sendVerificationEmail(email: string, token: string) {
    const url = `${this.config.get('appBaseUrl')}/verify-email?token=${token}`;
    await this.email.sendSystem(email, 'Verify your MailFlow email',
      `<p>Welcome to MailFlow. Confirm your address:</p><p><a href="${url}">${url}</a></p>`);
  }
}
