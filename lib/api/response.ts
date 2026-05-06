import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiSuccess<T> = {
  data: T;
  error: null;
  status: number;
};

export type ApiFailure = {
  data: null;
  error: string;
  status: number;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function jsonOk<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null, status }, { status });
}

export function jsonError(error: string, status = 500): NextResponse<ApiFailure> {
  return NextResponse.json({ data: null, error, status }, { status });
}

export function errorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
