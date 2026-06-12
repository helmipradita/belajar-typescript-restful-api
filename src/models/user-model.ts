import {User} from "@prisma/client";

export type UserResponse = {
    username: string;
    name: string;
}

export type TokenResponse = {
    access_token: string;
    refresh_token: string;
}

export type CreateUserRequest = {
    username: string;
    name: string;
    password: string;
}

export type LoginUserRequest = {
    username: string;
    password: string;
}

export type RefreshTokenRequest = {
    refresh_token: string;
}

export type UpdateUserRequest = {
    name?: string;
    password?: string;
}

export function toUserResponse(user: User): UserResponse {
    return {
        name: user.name,
        username: user.username
    }
}
