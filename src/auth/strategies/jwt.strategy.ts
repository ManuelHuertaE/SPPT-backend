import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { last } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    businessId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                business: true,
            }
        });

        if (!user || !user.active) {
            throw new UnauthorizedException('Uusario no válido o inactivo');
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            businessId: user.businessId,
            name: user.name,
            lastname: user.lastName,
        }
    }
}