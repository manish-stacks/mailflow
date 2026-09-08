import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, Roles, WorkspaceId } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '@/common/guards/workspace.guard';
import { CreateMemberLoginDto, CreateWorkspaceDto, InviteMemberDto, UpdateMemberDto, UpdateWorkspaceDto } from './dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private svc: WorkspacesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) { return this.svc.listForUser(userId); }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWorkspaceDto) { return this.svc.create(userId, dto); }

  @Get('current')
  @UseGuards(WorkspaceGuard)
  current(@WorkspaceId() id: string) { return this.svc.findOne(id); }

  @Patch('current')
  @UseGuards(WorkspaceGuard) @Roles('admin')
  update(@WorkspaceId() id: string, @Body() dto: UpdateWorkspaceDto, @CurrentUser('id') userId: string) {
    return this.svc.update(id, dto, userId);
  }

  @Delete('current')
  @UseGuards(WorkspaceGuard) @Roles('owner')
  remove(@WorkspaceId() id: string, @CurrentUser('id') userId: string) { return this.svc.remove(id, userId); }

  @Get('members')
  @UseGuards(WorkspaceGuard)
  members(@WorkspaceId() id: string) { return this.svc.listMembers(id); }

  @Post('members')
  @UseGuards(WorkspaceGuard) @Roles('admin')
  invite(@WorkspaceId() id: string, @Body() dto: InviteMemberDto, @CurrentUser('id') userId: string) {
    return this.svc.invite(id, dto, userId);
  }

  /** Create the login directly instead of sending an invite link. */
  @Post('members/create-login')
  @UseGuards(WorkspaceGuard) @Roles('admin')
  createLogin(@WorkspaceId() id: string, @Body() dto: CreateMemberLoginDto, @CurrentUser('id') userId: string) {
    return this.svc.createMemberLogin(id, dto, userId);
  }

  @Post('members/:memberId/reset-password')
  @UseGuards(WorkspaceGuard) @Roles('admin')
  resetMemberPassword(@WorkspaceId() id: string, @Param('memberId') memberId: string, @CurrentUser('id') userId: string) {
    return this.svc.resetMemberPassword(id, memberId, userId);
  }

  @Patch('members/:memberId')
  @UseGuards(WorkspaceGuard) @Roles('admin')
  updateMember(@WorkspaceId() id: string, @Param('memberId') memberId: string, @Body() dto: UpdateMemberDto, @CurrentUser('id') userId: string) {
    return this.svc.updateMember(id, memberId, dto, userId);
  }

  @Delete('members/:memberId')
  @UseGuards(WorkspaceGuard) @Roles('admin')
  removeMember(@WorkspaceId() id: string, @Param('memberId') memberId: string, @CurrentUser('id') userId: string) {
    return this.svc.removeMember(id, memberId, userId);
  }

  @Get('audit-logs')
  @UseGuards(WorkspaceGuard) @Roles('admin')
  audit(@WorkspaceId() id: string) { return this.svc.auditLogs(id); }
}
