export interface User {
    id?: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    token?: string;
}


export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
    };
}