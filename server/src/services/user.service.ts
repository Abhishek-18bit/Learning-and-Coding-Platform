import { PrismaClient, User, Role } from '@prisma/client';
import prisma from '../db/prisma';

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
}
