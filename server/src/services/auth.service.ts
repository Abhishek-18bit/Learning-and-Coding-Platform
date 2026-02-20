import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { UserService } from './user.service';
import { ApiError } from '../utils/errors';
import { Role } from '@prisma/client';

export class AuthService {
    static async register(data: any) {
        const existingUser = await UserService.findByEmail(data.email);
        if (existingUser) {
            throw new ApiError(400, 'User already exists with this email');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await UserService.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role as Role,
        });

        return { message: 'User registered successfully' };
    }

    static async login(data: any) {
        const user = await UserService.findByEmail(data.email);
        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Invalid email or password');
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
            },
        };
    }
}
