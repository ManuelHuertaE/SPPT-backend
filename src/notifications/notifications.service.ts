import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import twilio from 'twilio';

@Injectable()
export class NotificationsService implements OnModuleInit {
    private twilioClient: twilio.Twilio;
    private readonly CODE_EXPIRY_MINUTES = 15;
    private nodeEnv: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    onModuleInit() {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        this.nodeEnv = this.configService.get<string>('NODE_ENV') || 'production';

        console.log('\n🔧 Inicializando NotificationsService...');
        console.log(`   NODE_ENV: ${this.nodeEnv || 'undefined'}`);
        console.log(`   TWILIO_ACCOUNT_SID: ${accountSid ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`   TWILIO_AUTH_TOKEN: ${authToken ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`   TWILIO_WHATSAPP_NUMBER: ${this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '❌ No configurado'}\n`);

        if (this.nodeEnv === 'development') {
            console.log('🧪 Modo desarrollo activado - Se usará mock de WhatsApp\n');
        } else if (!accountSid || !authToken) {
            console.warn('⚠️  Twilio credentials no configuradas. WhatsApp no funcionará\n');
        } else {
            this.twilioClient = twilio(accountSid, authToken);
            console.log('✅ Cliente Twilio inicializado correctamente\n');
        }
    }

    private generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async sendVerificationWhatsApp(phone: string, code: string, clientName: string): Promise<void> {
        console.log('\n📤 Intentando enviar WhatsApp...');
        console.log(`   Destinatario: ${clientName}`);
        console.log(`   Teléfono: ${phone}`);
        console.log(`   Código: ${code}`);
        
        // Para desarrollo sin Twilio
        if (this.nodeEnv === 'development') {
            console.log('🧪 Modo desarrollo detectado - Usando mock');
            console.log(`\n┌─────────────────────────────────────┐`);
            console.log(`│      📱 WhatsApp Mock               │`);
            console.log(`├─────────────────────────────────────┤`);
            console.log(`│ Para: ${clientName.padEnd(28)}│`);
            console.log(`│ Tel: ${phone.padEnd(29)}│`);
            console.log(`│ Código: ${code.padEnd(26)}│`);
            console.log(`│ Expira: ${this.CODE_EXPIRY_MINUTES} minutos${' '.repeat(20)}│`);
            console.log(`└─────────────────────────────────────┘\n`);
            return;
        }

        if (!this.twilioClient) {
            console.error('❌ Cliente Twilio no inicializado');
            throw new BadRequestException('Servicio de WhatsApp no configurado');
        }

        const message = `🔐 *SPPT - Verificación de cuenta*\n\nHola *${clientName}*,\n\nTu código de verificación es:\n\n*${code}*\n\n⏱️ Este código expira en ${this.CODE_EXPIRY_MINUTES} minutos.\n\n_Si no solicitaste este código, ignora este mensaje._`;

        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
            const whatsappFrom = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');
            const whatsappTo = `whatsapp:${formattedPhone}`;

            console.log(`   De: ${whatsappFrom}`);
            console.log(`   Para: ${whatsappTo}`);
            console.log('   Enviando mensaje...');
            
            const result = await this.twilioClient.messages.create({
                body: message,
                from: whatsappFrom,
                to: whatsappTo,
            });

            console.log(`✅ WhatsApp enviado exitosamente`);
            console.log(`   Message SID: ${result.sid}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   To: ${result.to}\n`);
        } catch (error) {
            console.error('❌ Error enviando WhatsApp:');
            console.error(`   Tipo: ${error.constructor.name}`);
            console.error(`   Código: ${error.code || 'N/A'}`);
            console.error(`   Mensaje: ${error.message}`);
            if (error.moreInfo) {
                console.error(`   Más info: ${error.moreInfo}`);
            }
            console.error('');
            throw new BadRequestException('No se pudo enviar el mensaje de WhatsApp. Verifica que el número esté registrado en el sandbox de Twilio.');
        }
    }

    async requestVerification(requestDto: RequestVerificationDto) {
        const { phone } = requestDto;

        console.log('\n🔍 Solicitando verificación...');
        console.log(`   Teléfono recibido: ${phone}`);

        const client = await this.prisma.client.findUnique({
            where: { phone },
        });

        if (!client) {
            console.log(`❌ Cliente no encontrado con teléfono: ${phone}`);
            throw new NotFoundException('Cliente no encontrado con el número de teléfono proporcionado');
        }

        console.log(`✅ Cliente encontrado: ${client.name} (ID: ${client.id})`);

        if (!client.active) {
            console.log('❌ Cliente inactivo');
            throw new BadRequestException('El cliente no está activo');
        }

        console.log('🔄 Invalidando códigos anteriores...');
        const invalidated = await this.prisma.verificationCode.updateMany({
            where: {
                clientId: client.id,
                used: false,
            },
            data: {
                used: true,
                usedAt: new Date(),
            },
        });
        console.log(`   Códigos invalidados: ${invalidated.count}`);

        const code = this.generateCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

        console.log('💾 Guardando código en base de datos...');
        await this.prisma.verificationCode.create({
            data: {
                clientId: client.id,
                code,
                expiresAt,
            },
        });
        console.log('✅ Código guardado');

        await this.sendVerificationWhatsApp(phone, code, client.name);

        const maskedPhone = phone.replace(/(\+\d{2})\d{6}(\d{4})/, '$1******$2');
        console.log(`✅ Proceso completado. Teléfono enmascarado: ${maskedPhone}\n`);

        return {
            message: 'Código de verificación enviado por WhatsApp',
            phone: maskedPhone,
            expiresIn: `${this.CODE_EXPIRY_MINUTES} minutos`,
        };
    }

    async verifyCode(verifyDto: VerifyCodeDto) {
        const { phone, code } = verifyDto;

        console.log('\n🔐 Verificando código...');
        console.log(`   Teléfono: ${phone}`);
        console.log(`   Código: ${code}`);

        const client = await this.prisma.client.findUnique({
            where: { phone },
        });

        if (!client) {
            console.log('❌ Cliente no encontrado');
            throw new NotFoundException('Cliente no encontrado');
        }

        console.log(`✅ Cliente encontrado: ${client.name}`);

        const verificationCode = await this.prisma.verificationCode.findFirst({
            where: {
                clientId: client.id,
                code,
                used: false,
                expiresAt: {
                    gte: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!verificationCode) {
            console.log('❌ Código inválido o expirado');
            throw new BadRequestException('Código de verificación inválido o expirado');
        }

        console.log('✅ Código válido, marcando como verificado...');

        await this.prisma.$transaction([
            this.prisma.verificationCode.update({
                where: { id: verificationCode.id },
                data: {
                    used: true,
                    usedAt: new Date(),
                },
            }),
            this.prisma.client.update({
                where: { id: client.id },
                data: {
                    phoneVerified: true,
                },
            }),
        ]);

        console.log(`✅ Teléfono verificado exitosamente para ${client.name}\n`);

        return {
            message: 'Teléfono verificado exitosamente',
            verified: true,
            clientId: client.id,
        };
    }

    async cleanExpiredCodes() {
        console.log('🧹 Limpiando códigos expirados...');
        const result = await this.prisma.verificationCode.deleteMany({
            where: {
                OR: [
                    { used: true },
                    {
                        expiresAt: {
                            lt: new Date(),
                        },
                    },
                ],
            },
        });

        console.log(`✅ ${result.count} códigos eliminados\n`);

        return {
            message: `${result.count} códigos eliminados`,
        };
    }

    async isPhoneVerified(clientId: string): Promise<boolean> {
        const client = await this.prisma.client.findUnique({
            where: { id: clientId },
            select: { phoneVerified: true },
        });

        return client?.phoneVerified ?? false;
    }
}