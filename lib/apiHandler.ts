
// 🔥 SAFE API WRAPPER (Client-Side)
// Wraps Cloud Function calls to prevent UI crashes.

import { functions } from '../services/firebase';

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

/**
 * Wraps an async function call to a Firebase Cloud Function.
 * Returns a standardized { data, error } object.
 * 
 * Usage: 
 * const { data, error } = await safeApiCall('createOrder', { amount: 100 });
 * if (error) alert(error);
 */
export async function safeApiCall<T>(functionName: string, payload: any = {}): Promise<ApiResponse<T>> {
    if (!functions) {
        return { data: null, error: "System Error: API Gateway not initialized." };
    }

    try {
        const callable = functions.httpsCallable(functionName);
        const result = await callable(payload);
        return { data: result.data as T, error: null };
    } catch (err: any) {
        console.error(`[API Error] ${functionName}:`, err);
        
        let message = "An unexpected error occurred.";
        if (err.code) {
            switch(err.code) {
                case 'unauthenticated': message = "Please sign in to continue."; break;
                case 'permission-denied': message = "You do not have permission to perform this action."; break;
                case 'not-found': message = "The requested resource was not found."; break;
                case 'resource-exhausted': message = "Quota exceeded. Please upgrade your plan."; break;
                default: message = err.message || message;
            }
        } else if (err.message) {
            message = err.message;
        }

        return { data: null, error: message };
    }
}

/**
 * Generic safe handler for any async operation (non-Cloud Function).
 */
export async function safeHandler<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
    try {
        const data = await fn();
        return { data, error: null };
    } catch (err: any) {
        console.error("[Internal Error]:", err);
        return { data: null, error: err.message || "Internal execution failed." };
    }
}
