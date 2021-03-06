import { Request } from 'detritus-rest';

import { STATUS_CODES } from 'http';

const ratelimitStatusCode = 429;

/**
 * The main fAPI error. If a request returns an invalid status code (non-200), it will be thrown as a fAPI error.
 */
export class FapiError extends Error {
    public statusCode: number
    public request: Request

    constructor (message: string, statusCode: number, request: Request) {
      super(message);
      this.statusCode = statusCode;
      this.request = request;
    }
}

/**
 * An extension of FapiError that also contains ratelimit reset info and is only fired on responses with a http status code of 429.
 */
export class RatelimitError extends FapiError {
    public ratelimitReset: number

    constructor (ratelimitReset: number, request: Request) {
      super(<string> STATUS_CODES[ratelimitStatusCode], ratelimitStatusCode, request);
      this.ratelimitReset = ratelimitReset;
    }
}
