import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantsRepository } from '../tenants/tenants.repository';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload.interface';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly tenantsRepository: TenantsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const tenant = await this.tenantsRepository.createWithOwner({
      tenantName: dto.tenantName,
      ownerName: dto.name,
      ownerEmail: dto.email,
      passwordHash,
    });
    const owner = tenant.users[0];

    return this.buildAuthResponse(owner.id, tenant.id, owner.role, {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      tenantId: tenant.id,
      tenantName: tenant.name,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user.id, user.tenantId, user.role, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });
  }

  private buildAuthResponse(
    userId: string,
    tenantId: string,
    role: JwtPayload['role'],
    user: Record<string, unknown>,
  ) {
    const payload: JwtPayload = { sub: userId, tenantId, role };
    return { accessToken: this.jwtService.sign(payload), user };
  }
}
