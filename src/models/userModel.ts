import db from '../config/database';
import { IUser, CreateUserDto } from '../types';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';



class UserModel {
  private tableName = 'users';

  async create(data: CreateUserDto, trx?: Knex.Transaction): Promise<IUser> {
    const connection = trx || db;
    
    const id = uuidv4();

    await connection(this.tableName).insert({
      id,
      ...data,
      is_blacklisted: data.is_blacklisted ?? false,
    });

    const user = await this.findById(id, trx);
    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  async existsByEmail(email: string, trx?: Knex.Transaction): Promise<boolean> {
    const connection = trx || db;
    const user = await connection(this.tableName).where({ email }).first();
    return !!user;
  }

  async existsByPhone(phone: string, trx?: Knex.Transaction): Promise<boolean> {
    const connection = trx || db;
    const user = await connection(this.tableName).where({ phone }).first();
    return !!user;
  }

  async verifyPassword(plainPassword: string, hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = 12; 
    return await bcrypt.hash(plainPassword, saltRounds);
  }

  async findById(id: string, trx?: Knex.Transaction): Promise<IUser | null> {
    const connection = trx || db;
    return await connection(this.tableName).where({ id }).first();
  }

  async findByEmail(email: string, trx?: Knex.Transaction): Promise<IUser | null> {
    const connection = trx || db;
    return await connection(this.tableName).where({ email }).first();
  }

  async updateBlacklistStatus(userId: string, isBlacklisted: boolean): Promise<void> {
    await db(this.tableName)
      .where({ id: userId })
      .update({ is_blacklisted: isBlacklisted });
  }
}

export default new UserModel();