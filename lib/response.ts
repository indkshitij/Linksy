import { NextResponse } from "next/server";

export function successResponse<T>(
  message: string,
  data: T = null as T,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  status = 400,
  data: unknown = null
) {
  return NextResponse.json(
    {
      success: false,
      message,
      data,
    },
    { status }
  );
}