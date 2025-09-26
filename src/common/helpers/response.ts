import { HttpStatus } from "@nestjs/common";
import { DEFAULT_SUCCESS_MESSAGE } from "../constants";

export class SuccessResponse {
    constructor(data = {}) {
        return {
            code: HttpStatus.OK,
            message: DEFAULT_SUCCESS_MESSAGE,
            data,
        };
    }
}

export class ErrorResponse {
    constructor(
        code = HttpStatus.INTERNAL_SERVER_ERROR,
        message = '',
        errors: string[] = [],
    ) {
        return {
            code,
            message,
            errors,
        };
    }
}