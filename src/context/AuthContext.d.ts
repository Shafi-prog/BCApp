import React, { ReactNode } from 'react';
export interface User {
    type: 'admin' | 'school';
    schoolName?: string;
    principalId?: string;
    schoolId?: number;
}
interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}
export declare const AuthProvider: React.FC<{
    children: ReactNode;
}>;
export declare const useAuth: () => AuthContextType;
export {};
