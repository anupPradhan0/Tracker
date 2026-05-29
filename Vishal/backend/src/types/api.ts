export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiConflictBody {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody | ApiConflictBody;

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
