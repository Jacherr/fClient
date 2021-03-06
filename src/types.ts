/* eslint-disable camelcase */
import { BeforeRequestOptions } from 'detritus-rest';

/**
* All HTTP request methods the client may use.
*/
export enum HttpMethods {
    GET = 'GET',
    POST = 'POST'
}

/**
* Each endpoint either returns JSON or string/buffer. The request function takes one of these as an option.
*/
export enum ReturnMethods {
    JSON = 'json',
    BODY = 'body',
}

/**
 * All specific headers that may be handled within the client itself.
 */
export enum ReturnHeaders {
    IMAGESCRIPT_CPUTIME = 'x-imagescript-cputime',
    IMAGESCRIPT_WALLTIME = 'x-imagescript-walltime',
    IMAGESCRIPT_MEMORY = 'x-imagescript-memory',
    RATELIMIT_RESET = 'x-rate-limit-reset',
    RATELIMIT_LIMIT = 'x-rate-limit-limit',
    RATELIMIT_REMAINING = 'x-rate-limit-remaining',
    CONTENT_TYPE = 'content-type'
}

export enum ContentTypes {
    PNG = 'image/png',
    GIF = 'image/gif'
}

export enum ImageTypes {
    PNG = 'png',
    GIF = 'gif'
}

/**
 * The most recently returned ratelimit headers, if any.
 */
export interface RatelimitState {
    [ReturnHeaders.RATELIMIT_RESET]?: number,
    [ReturnHeaders.RATELIMIT_REMAINING]?: number,
    [ReturnHeaders.RATELIMIT_LIMIT]?: number
}

/**
 * Events that the client may fire.
 */
export namespace RequestEvents {
    export interface Request {
        request: Request
    }

    export interface Response {
        request: Request,
        response: Response
    }

    export interface Ratelimit {
        request: Request,
        response: Response
        ratelimitReset: number
    }

    export type Events = 'ratelimit' | 'request' | 'response'
    export type EventsPayload = Request | Response | Ratelimit
}

/**
 * All request types documented here are 100% optional. All mandatory types are separate parameters.
 */
export namespace RequestTypes {
    export type Request = (BeforeRequestOptions & {
        returnType?: ReturnMethods,
        contentType?: string,
        returnHeaders?: boolean
    })

    export interface _4Chan {
        board?: string,
        thread?: string
    }

    export interface DuckDuckGoImages {
        safe?: boolean
    }

    export interface Emojify {
        vertical?: boolean
    }

    export interface Eval {
        target?: 'local' | 'master' | 'workers'
    }

    export type EyesOverlay = 'big' | 'black' | 'blood' | 'blue' | 'googly' | 'green' | 'horror' | 'illuminati' | 'money' | 'normal' | 'pink' | 'red' | 'small' | 'spinner' | 'spongebob' | 'white' | 'yellow' | 'lucille'

    export interface FaceMagik {
        text?: 'rain' | 'gold' | 'swirl' | 'frost' | 'blur' | 'charcoal' | 'tehi' | 'pixelate' | 'spin' | 'magika' | 'implode' | 'explode' | 'circle' | 'pseudocolor' | 'kaleidoscope' | 'toon' | 'ripples' | 'e2p' | 'emoji' | 'magik',
        option?: 1 | 2 | 3
    }

    export interface Glitch {
        iterations?: number,
        amount?: number
    }

    export interface Glow {
        amount?: number
    }

    export type ImageScriptInject = { [key: string]: string | number }

    export interface Lego {
        resolution?: number
    }

    export interface MagikScript {
        options?: string[],
        size?: string,
        gif?: boolean
    }

    export interface Pixelate {
        amount?: number
    }

    export interface Pne {
        option?: 0 | 1 | 2 | 3 | 4
    }

    export namespace Quote {
        export namespace Embed {
            export interface Footer {
                text: string;
                icon_url?: string;
                proxy_icon_url?: string;
              }

              export interface Image {
                url?: string;
                proxy_url?: string;
                height?: number;
                width?: number;
              }

              export interface Thumbnail {
                url?: string;
                proxy_url?: string;
                height?: number;
                width?: number;
              }

              export interface Video {
                url?: string;
                height?: number;
                width?: number;
              }

              export interface Provider {
                name?: string;
                url?: string;
              }

              export interface Author {
                name?: string;
                url?: string;
                icon_url?: string;
                proxy_icon_url?: string;
              }

              export interface Field {
                name: string;
                value: string;
                inline?: boolean;
              }

              export interface Embed {
                title?: string;
                type?: string;
                description?: string;
                url?: string;
                timestamp?: string;
                color?: number;
                footer?: Footer;
                image?: Image;
                thumbnail?: Thumbnail;
                video?: Video;
                provider?: Provider;
                author?: Author;
                fields?: Field[];
              }
        }
        export interface Author {
            color: string,
            username: string,
            bot?: boolean,
            avatarURL: string
        }
        export interface Quote {
            message: Embed.Embed | string,
            author: Author,
            light?: boolean,
            compact?: boolean,
            timestamp: string
        }
    }

    export interface EmojiMosaic {
        resolution?: number
    }

    export interface Screenshot {
        allowNSFW?: boolean,
        wait?: number
    }

    export interface Snapchat {
        filter?: 'angery' | 'bambi' | 'dog ' | 'dog2' | 'bunny' | 'cat' | 'cat2' | 'christmas' | 'heart' | 'joy' | 'flowers' | 'flowers2' | 'devil' | 'glasses' | 'moustache' | 'notsobot' | 'autism' | 'sunglasses' | 'squidward' | 'thug' | 'thinking' | 'thanos'
        snow?: boolean
    }

    export interface Thinking {
        level?: string
    }
}

/**
 * Everything that fAPI may return that is not a generic buffer or string.
 */
export namespace ReturnTypes {
    export interface DuckDuckGo {
        results: DuckDuckGoResult[]
    }

    export interface DuckDuckGoResult {
        title: string,
        link: string
    }

    export namespace FaceDetection {
        export interface Result {
            faceRectangle: FaceRectangle;
            faceAttributes: FaceAttributes;
            faceLandmarks: FaceLandmarks;
            original: Original;
        }

        export interface FaceAttributes {
            headPose: HeadPose;
        }

        export interface HeadPose {
            roll: number;
            yaw: number;
            pitch: number;
        }

        export interface FaceLandmarks {
            pupilLeft: PupilLeft;
            pupilRight: PupilLeft;
            mouth: Mouth;
        }

        export interface Mouth {
            width: number;
            height: number;
            x: number;
            y: number;
        }

        export interface PupilLeft {
            x: number;
            y: number;
        }

        export interface FaceRectangle {
            top: number;
            left: number;
            width: number;
            height: number;
        }

        export interface Original {
            face_token: string;
            face_rectangle: FaceRectangle;
            landmark: { [key: string]: PupilLeft };
            attributes: Attributes;
        }

        export interface Attributes {
            headpose: Headpose;
        }

        export interface Headpose {
            pitch_angle: number;
            roll_angle: number;
            yaw_angle: number;
        }
    }

    export interface ImageScript {
        image: Buffer,
        format: ImageTypes,
        cpuTime: number,
        wallTime: number,
        memoryUsage: number
    }

    export type PathList = { [key: string]: { methods: string[], routes: string[] }}

    export interface UrbanDictionaryResult {
        header: string,
        meaning: string,
        example: string,
        tags: string[]
    }

    export type UrbanDictionary = UrbanDictionaryResult[]
}
