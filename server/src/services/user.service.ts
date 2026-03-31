import { User } from '@prisma/client';
import prisma from '../db/prisma';
import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/errors';

interface UpdateProfileInput {
    name: string;
    email: string;
}

interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

export class UserService {
    static async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    static async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    static async create(data: any): Promise<User> {
        return prisma.user.create({
            data,
        });
    }

    static async updateProfile(userId: string, data: UpdateProfileInput): Promise<User> {
        const existingUser = await this.findById(userId);
        if (!existingUser) {
            throw new ApiError(404, 'User not found');
        }

        if (data.email !== existingUser.email) {
            const emailOwner = await this.findByEmail(data.email);
            if (emailOwner && emailOwner.id !== userId) {
                throw new ApiError(400, 'User already exists with this email');
            }
        }

        return prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                email: data.email,
            },
        });
    }

    static async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true },
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new ApiError(400, 'Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }
}
