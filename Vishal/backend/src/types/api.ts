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

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  provider: string;
  createdAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
