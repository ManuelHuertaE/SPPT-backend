import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

export interface JwtClientPayload {
  sub: string; // clientId
  phone: string;
  email?: string;
}

@Injectable()
export class JwtClientStrategy extends PassportStrategy(Strategy, 'jwt-client') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtClientPayload) {
  
    const client = await this.prisma.client.findUnique({
      where: { id: payload.sub },
      include: {
        clientBusinesses: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!client) {
      throw new UnauthorizedException('Cliente no encontrado');
    }

    if (!client.active) {
      throw new UnauthorizedException('Cliente inactivo');
    }

    return client;
  }
}