import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        // Verificar si la ruta es pública
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic){
            return true;
        }

        //Ignorar rutas de clientes (dejar que JwtClientAuthGuard las maneje)
        const request = context.switchToHttp().getRequest();
        if (request.url.startsWith('/clients')) {
            return true; // Dejar pasar, el JwtClientAuthGuard lo manejará
        }

        return super.canActivate(context);
    }
}