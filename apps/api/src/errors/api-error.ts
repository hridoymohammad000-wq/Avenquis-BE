export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    arg2: string,
    arg3?: string,
    details?: unknown,
  ) {
    let message = arg2;
    let code = arg3 || "ERROR";

    if (arg3) {
      if (/^[A-Z0-9_]+$/.test(arg2) && !/^[A-Z0-9_]+$/.test(arg3)) {
        code = arg2;
        message = arg3;
      } else {
        message = arg2;
        code = arg3;
      }
    }

    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
