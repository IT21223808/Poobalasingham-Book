import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey:
        configService.getOrThrow<string>(
          'JWT_SECRET',
        ),
    });
  }

  async validate(payload: {
  sub: number;
  email: string;
  role: string;
  locationId?: number | null;
  tillId?: number | null;
}) {
  console.log("✅ JWT VALIDATED:", payload);

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    locationId: payload.locationId ?? null,
    tillId: payload.tillId ?? null,
  };
}
}