import { EventEmitter } from 'events';

import { RequestTypes, HttpMethods, ReturnMethods, ReturnTypes, RequestEvents, ReturnHeaders, RatelimitState, ContentTypes, ImageTypes } from './types';

import { Client as RestClient, RequestSettings, Response as FapiResponse } from 'detritus-rest';

import Package from '../package.json';

import os from 'os';

import * as Api from './endpoints';

import { FapiError, RatelimitError } from './errors';

export interface ClientOptions {
    baseUrl?: string,
    auth?: string,
    timeout?: number
}

const defaultSettings: RequestSettings = {
  timeout: 15000
};

const userAgent = `fAPIClient v${Package.version} (${os.type()} ${os.release()}; ${os.arch()})`;

/**
*  The main client. All fAPI endpoints can be accessed and requested from here.
*/
export class Client extends EventEmitter {
    private auth: string
    public baseUrl: string

    public ratelimitState: RatelimitState = {}

    public restClient: RestClient

    constructor (options: ClientOptions = {}) {
      super();

      if (options.auth && !options.auth.startsWith('Bearer')) {
        this.auth = `Bearer ${options.auth}`;
      } else if (options.auth && options.auth.startsWith('Bearer')) {
        this.auth = options.auth;
      } else {
        this.auth = '';
      }

      this.baseUrl = options.baseUrl || Api.Base;

      const settings: RequestSettings = defaultSettings;
      if (options.timeout) settings.timeout = options.timeout;

      this.restClient = new RestClient({
        headers: {
          Authorization: this.auth,
          'user-agent': userAgent
        },
        settings,
        baseUrl: this.baseUrl
      });
    }

    /**
    * The most recently returned ratelimit headers, if any.
    */
    get ratelimits (): RatelimitState {
      return this.ratelimitState;
    }

    /**
    * The timeout for every request sent to fAPI.
    */
    get timeout () {
      return <number> this.restClient.settings.timeout;
    }

    set timeout (value: number) {
      this.restClient.settings.timeout = value;
    }

    /**
    * The main request function. This function is mainly for internal use, since the client already implements this function for every endpoint.
    */
    public async request (options: RequestTypes.Request): Promise<any> {
      if (options.method !== HttpMethods.GET && options.headers) {
        options.headers[ReturnHeaders.CONTENT_TYPE] = options.contentType || 'application/json';
      }

      this.emit('request', { request: options });

      const res: FapiResponse = await this.restClient.request(options);

      const headers: any = res.headers;
      const ratelimitHeaders = [ReturnHeaders.RATELIMIT_LIMIT, ReturnHeaders.RATELIMIT_REMAINING, ReturnHeaders.RATELIMIT_RESET];

      for (const headerKey of ratelimitHeaders) {
        if (headers[headerKey]) {
          // We can ignore ts warning here because `headerKey` will never be a key not referenced by RatelimitState
          // @ts-ignore
          this.ratelimitState[headerKey] = headers[headerKey];
        }
      };

      if (res.statusCode === 429) {
        let ratelimitReset = parseInt(res.headers[ReturnHeaders.RATELIMIT_RESET]);
        if (isNaN(ratelimitReset)) {
          ratelimitReset = 0;
        }
        this.emit('ratelimit', { request: options, response: res, ratelimitReset });
        throw new RatelimitError(ratelimitReset, res.request);
      }

      this.emit('response', { response: res });

      if (!(res.statusCode === 200)) {
        const body = await res.body();
        throw new FapiError(body, res.statusCode, res.request);
      }

      let returnValue: any;

      switch (options.returnType) {
        case ReturnMethods.BODY:
          returnValue = await res.body();
          break;
        case ReturnMethods.JSON: {
          let json;
          try {
            json = await res.json();
          } catch {
            returnValue = await res.body();
          }
          returnValue = json;
          break;
        }
        default:
          returnValue = res;
      }

      if (options.returnHeaders) {
        returnValue = { body: returnValue, headers: res.headers };
      }

      return returnValue;
    }

    /**
    * The standard internal request function for endpoints that return an image buffer. The request options for each endpoint here are similar, so we can use a function for it.
    */
    public fetchImage (endpoint: string, body: any): Promise<Buffer> {
      if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: endpoint
        },
        body,
        returnType: ReturnMethods.BODY
      });
    }

    /**
    * A specific internal request function that handles endpoints that only take an image URL as input and return an image buffer.
    */
    public requestImageFromImage (endpoint: string, image: string): Promise<Buffer> {
      const body = {
        images: [image]
      };

      return this.fetchImage(endpoint, body);
    }

    /**
    * A specific internal request function that handles endpoints that only take text as input and return an image buffer.
    */
    public requestImageFromText (endpoint: string, text: string): Promise<Buffer> {
      const body = {
        args: {
          text
        }
      };

      return this.fetchImage(endpoint, body);
    }

    /**
    * A specific internal request function that handles endpoints that only takes text and an image URL as inputs and returns an image buffer.
    */
    public requestImageFromBoth (endpoint: string, image: string, text: string): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          text
        }
      };

      return this.fetchImage(endpoint, body);
    }

    public getPaths (): Promise<ReturnTypes.PathList> {
      return this.request({
        method: HttpMethods.GET,
        route: {
          path: Api.Routes.PATHLIST
        },
        returnType: ReturnMethods.JSON
      });
    }

    public fetch4ChanBoard (options: RequestTypes._4Chan = {}) {
      let path = Api.Routes._4CHAN.toString();

      if (options.board) {
        path += `/${options.board}`;
        if (options.thread) {
          path += `/${options.thread}`;
        }
      }

      return this.request({
        method: HttpMethods.GET,
        route: {
          path
        },
        returnType: ReturnMethods.BODY
      });
    }

    public _9Gag (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes._9GAG, image);
    }

    public adidas (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.ADIDAS, image);
    }

    public adminWalk (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.ADW, image);
    }

    public aiMagik (image: string) {
      return this.requestImageFromImage(Api.Routes.AIMAGIK, image);
    }

    public ajit (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.AJIT, image);
    }

    public america (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.AMERICA, image);
    }

    public analysis (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.ANALYSIS, image);
    }

    public austin (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.AUSTIN, image);
    }

    public autism (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.AUTISM, image);
    }

    public bandicam (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.BANDICAM, image);
    }

    public bernie (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.BERNIE, image);
    }

    public binoculars (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.BINOCULARS, image);
    }

    public blackify (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.BLACKIFY, image);
    }

    public blackPanther (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.BLACKPANTHER, image);
    }

    public bobRoss (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.BOBROSS, image);
    }

    public buzzFeed (text?: string): Promise<Buffer> {
      // not using Client.requestImageFromText because text can be undefined here

      const body = {
        args: {
          text
        }
      };

      return this.fetchImage(Api.Routes.BUZZFEED, body);
    }

    public changeMyMind (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.CHANGEMYMIND, text);
    }

    public composite (images: string | string[]): Promise<Buffer> {
      const body = {
        images: Array.isArray(images) ? images : [images]
      };

      return this.fetchImage(Api.Routes.COMPOSITE, body);
    }

    public consent (image: string, text: string): Promise<Buffer> {
      return this.requestImageFromBoth(Api.Routes.CONSENT, image, text);
    }

    public coolGuy (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.COOLGUY, image);
    }

    public days (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.DAYS, text);
    }

    public deepfry (image: string, strength: number): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          text: strength
        }
      };

      return this.fetchImage(Api.Routes.DEEPFRY, body);
    }

    public depression (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.DEPRESSION, image);
    }

    public disabled (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.DISABLED, image);
    }

    public dork (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.DORK, image);
    }

    public duckDuckGo (query: string): Promise<ReturnTypes.DuckDuckGo> {
      const body = {
        args: {
          text: query
        }
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.DUCKDUCKGO
        },
        body,
        returnType: ReturnMethods.JSON
      });
    }

    public duckDuckGoImages (query: string, options: RequestTypes.DuckDuckGoImages = {}): Promise<string[]> {
      let safetyLevel: number = -2;
      if (options.safe === undefined || options.safe === true) safetyLevel = 1;

      const body = {
        args: {
          text: query,
          safetyLevel
        }
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.DUCKDUCKGOIMAGES
        },
        body,
        returnType: ReturnMethods.JSON
      });
    }

    public edges (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.EDGES, image);
    }

    public edges2Emojis (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.EDGES2EMOJIS, image);
    }

    public edges2EmojisGif (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.EDGES2EMOJISGIF, image);
    }

    public edges2Porn (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.EDGES2PORN, image);
    }

    public edges2PornGif (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.EDGES2PORNGIF, image);
    }

    public emojify (image: string, text: string, foregroundEmoji: string, backgroundEmoji: string, options: RequestTypes.Emojify = {}): Promise<string> {
      const body = {
        images: [image],
        args: {
          text,
          foreground: foregroundEmoji,
          background: backgroundEmoji,
          vertical: options.vertical
        }
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.EMOJIFY
        },
        body,
        returnType: ReturnMethods.BODY
      });
    }

    public emojiMosaic (image: string, options: RequestTypes.EmojiMosaic = {}): Promise<Buffer> {
      return this.requestImageFromBoth(Api.Routes.EMOJIMOSAIC, image, options.resolution?.toString() || '');
    }

    public eval (text: string, options: RequestTypes.Eval = {}): Promise<string> {
      const body = {
        args: {
          text,
          target: options.target
        }
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.EVAL
        },
        body,
        returnType: ReturnMethods.BODY
      });
    }

    public evalMagik (image: string, text: string | string[]): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          text
        }
      };

      return this.fetchImage(Api.Routes.EVALMAGIK, body);
    }

    public excuse (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.EXCUSE, image);
    }

    public eyes (image: string, overlay: RequestTypes.EyesOverlay): Promise<Buffer> {
      return this.requestImageFromBoth(Api.Routes.EYES, image, overlay);
    }

    public faceDetection (image: string): Promise<ReturnTypes.FaceDetection.Result> {
      const body = {
        images: [image]
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.FACEDETECTION
        },
        body,
        returnType: ReturnMethods.JSON
      });
    }

    public faceMagik (image: string, options: RequestTypes.FaceMagik = {}): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          text: options.text,
          option: options.option
        }
      };

      return this.fetchImage(Api.Routes.FACEMAGIK, body);
    }

    public faceOverlay (sourceImage: string, overlayImage: string): Promise<Buffer> {
      const body = {
        images: [sourceImage, overlayImage]
      };

      return this.fetchImage(Api.Routes.FACEOVERLAY, body);
    }

    public faceSwap (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.FACESWAP, image);
    }

    public gaben (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.GABEN, image);
    }

    public gay (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.GAY, image);
    }

    public glitch (image: string, options: RequestTypes.Glitch = {}): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          iterations: options.iterations,
          amount: options.amount
        }
      };

      return this.fetchImage(Api.Routes.GLITCH, body);
    }

    public glow (image: string, options: RequestTypes.Glow = {}): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          text: options.amount
        }
      };

      return this.fetchImage(Api.Routes.GLOW, body);
    }

    public god (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.GOD, image);
    }

    public goldstar (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.GOLDSTAR, image);
    }

    public grill (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.GRILL, text);
    }

    public hacker (text: string, template: number): Promise<Buffer> {
      const body = {
        args: {
          text,
          template
        }
      };

      return this.fetchImage(Api.Routes.HACKER, body);
    }

    public hawking (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.HAWKING, image);
    }

    public hyperCam (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.HYPERCAM, image);
    }

    public iDubbbz (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.IDUBBBZ, image);
    }

    public iFunny (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.IFUNNY, image);
    }

    public async imageScript (script: string, inject?: RequestTypes.ImageScriptInject): Promise<ReturnTypes.ImageScript> {
      const body = {
        args: {
          text: script,
          inject
        }
      };

      const res = await this.request({
        method: HttpMethods.POST,
        body,
        route: {
          path: Api.Routes.IMAGESCRIPT
        },
        returnHeaders: true,
        returnType: ReturnMethods.BODY
      });

      const contentType = res.headers[ReturnHeaders.CONTENT_TYPE];
      let imageType: ImageTypes;
      switch (contentType) {
        case ContentTypes.PNG:
          imageType = ImageTypes.PNG;
          break;
        case ContentTypes.GIF:
          imageType = ImageTypes.GIF;
          break;
        default:
          imageType = ImageTypes.PNG;
      }

      return {
        image: res.body,
        format: imageType,
        wallTime: parseFloat(res.headers[ReturnHeaders.IMAGESCRIPT_WALLTIME]), // ms
        cpuTime: parseFloat(res.headers[ReturnHeaders.IMAGESCRIPT_CPUTIME]), // ms
        memoryUsage: parseFloat(res.headers[ReturnHeaders.IMAGESCRIPT_MEMORY]) // mb
      };
    }

    public imageTagParser (text: string) {
      return this.requestImageFromText(Api.Routes.IMAGETAGPARSER, text);
    }

    public index () {
      return this.request({
        method: HttpMethods.GET,
        url: this.baseUrl,
        returnType: ReturnMethods.BODY
      });
    }

    public israel (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.ISRAEL, image);
    }

    public jack (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.JACK, image);
    }

    public jackoff (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.JACKOFF, image);
    }

    public jesus (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.JESUS, image);
    }

    public keemstar (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.KEEMSTAR, image);
    }

    public keemstar2 (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.KEEMSTAR2, image);
    }

    public kekistan (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.KEKISTAN, image);
    }

    public kirby (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.KIRBY, image);
    }

    public lego (image: string, options: RequestTypes.Lego = {}): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          text: options.resolution
        }
      };

      return this.fetchImage(Api.Routes.LEGO, body);
    }

    public linus (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.LINUS, image);
    }

    public logan (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.LOGAN, image);
    }

    public logout (text: string) {
      return this.requestImageFromText(Api.Routes.LOGOUT, text);
    }

    public magikScript (image: string, text: string, options: RequestTypes.MagikScript = {}): Promise<Buffer | null> { // appears to return null on invalid script
      const body = {
        images: [image],
        args: {
          text,
          options: options.options,
          size: options.size,
          gif: options.gif
        }
      };

      return this.fetchImage(Api.Routes.MAGIKSCRIPT, body);
    }

    public memorial (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.MEMORIAL, text);
    }

    public miranda (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.MIRANDA, image);
    }

    public mistake (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.MISTAKE, image);
    }

    public nooseguy (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.NOOSEGUY, image);
    }

    public northKorea (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.NORTHKOREA, image);
    }

    public oldGuy (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.OLDGUY, image);
    }

    public owo (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.OWO, image);
    }

    public perfection (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.PERFECTION, image);
    }

    public async ping (): Promise<number> {
      const start = Date.now();
      await this.index();
      return Date.now() - start;
    }

    public pistol (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.PISTOL, image);
    }

    public pixelate (image: string, options: RequestTypes.Pixelate = {}): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          amount: options.amount
        }
      };

      return this.fetchImage(Api.Routes.PIXELATE, body);
    }

    public pne (image: string, options: RequestTypes.Pne = {}): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          option: options.option
        }
      };

      return this.fetchImage(Api.Routes.PNE, body);
    }

    public pornhub (image: string, text: string): Promise<Buffer> {
      return this.requestImageFromBoth(Api.Routes.PORNHUB, image, text);
    }

    public portal (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.PORTAL, image);
    }

    public presidential (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.PRESIDENTIAL, text);
    }

    public proxy (url: string, reqBody: any): Promise<any> {
      const body = {
        body: reqBody
      };

      const query = {
        url
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.PROXY
        },
        query,
        body,
        returnType: ReturnMethods.BODY
      });
    }

    public quote (options: RequestTypes.Quote.Quote): Promise<Buffer> {
      const body = {
        args: options
      };

      return this.fetchImage(Api.Routes.QUOTE, body);
    }

    public racecard (light: string, dark: string): Promise<Buffer> {
      const body = {
        args: {
          text: [light, dark]
        }
      };
      return this.fetchImage(Api.Routes.RACECARD, body);
    }

    public realFact (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.REALFACT, text);
    }

    public recaptcha (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.RECAPTCHA, text);
    }

    public reminder (image: string, text: string): Promise<Buffer> {
      return this.requestImageFromBoth(Api.Routes.REMINDER, image, text);
    }

    public resize (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.RESIZE, image);
    }

    public respects (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.RESPECTS, image);
    }

    public retro (image: string, text: string): Promise<Buffer> {
      return this.requestImageFromBoth(Api.Routes.RETRO, image, text);
    }

    public rexTester (language: string, code: string): Promise<string> {
      const body = {
        args: {
          language,
          text: code
        }
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.REXTESTER
        },
        body,
        returnType: ReturnMethods.JSON
      });
    }

    public rtx (before: string, after: string): Promise<Buffer> {
      const body = {
        images: [before, after]
      };

      return this.fetchImage(Api.Routes.RTX, body);
    }

    public russia (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.RUSSIA, image);
    }

    public screenshot (url: string, options: RequestTypes.Screenshot = {}): Promise<Buffer> {
      const body = {
        args: {
          text: url,
          wait: options.wait,
          allowNSFW: options.allowNSFW
        }
      };

      return this.fetchImage(Api.Routes.SCREENSHOT, body);
    }

    public shit (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.SHIT, image);
    }

    public shooting (image: string, text: string): Promise<Buffer> {
      return this.requestImageFromBoth(Api.Routes.SHOOTING, image, text);
    }

    public shotgun (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.SHOTGUN, image);
    }

    public simpsonsDisabled (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.SIMPSONSDISABLED, text);
    }

    public smg (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.SMG, image);
    }

    public snapchat (image: string, options: RequestTypes.Snapchat = {}): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          text: options.filter,
          snow: options.snow
        }
      };

      return this.fetchImage(Api.Routes.SNAPCHAT, body);
    }

    public sonic (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.SONIC, text);
    }

    public spain (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.SPAIN, image);
    }

    public starman (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.STARMAN, image);
    }

    public steamPlaying (game: string): Promise<string> {
      const body = {
        args: {
          text: game
        }
      };

      const query = {
        json: true
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.STEAMPLAYING
        },
        query,
        body,
        returnType: ReturnMethods.JSON
      });
    }

    public stock (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.STOCK, image);
    }

    public supreme (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.SUPREME, image);
    }

    public thinking (image: string, options: RequestTypes.Thinking = {}): Promise<Buffer> {
      const body = {
        images: [image],
        args: {
          level: options.level
        }
      };

      return this.fetchImage(Api.Routes.THINKING, body);
    }

    public thonkify (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.THONKIFY, text);
    }

    public trans (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.TRANS, image);
    }

    public trump (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.TRUMP, image);
    }

    public ugly (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.UGLY, image);
    }

    public uk (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.UK, image);
    }

    public unmagik (image: string) {
      return this.requestImageFromImage(Api.Routes.UNMAGIK, image);
    }

    public urbanDictionary (query: string): Promise<ReturnTypes.UrbanDictionary> {
      const body = {
        args: {
          text: query
        }
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.URBANDICTIONARY
        },
        body,
        returnType: ReturnMethods.JSON
      });
    }

    public urlify (url: string): Promise<string> {
      const body = {
        args: {
          text: url
        }
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.URLIFY
        },
        body,
        returnType: ReturnMethods.BODY
      });
    }

    public ussr (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.USSR, image);
    }

    public vending (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.VENDING, image);
    }

    public watchMojo (image: string, text: string): Promise<Buffer> {
      return this.requestImageFromBoth(Api.Routes.WATCHMOJO, image, text);
    }

    public wheeze (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.WHEEZE, image);
    }

    public wikiHow (query: string): Promise<any> /* cant get it to return an article so no typings until i do */ {
      const body = {
        args: {
          text: query
        }
      };

      return this.request({
        method: HttpMethods.POST,
        route: {
          path: Api.Routes.WIKIHOW
        },
        body,
        returnType: ReturnMethods.JSON
      });
    }

    public wonka (text: string): Promise<Buffer> {
      return this.requestImageFromText(Api.Routes.WONKA, text);
    }

    public wth (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.WTH, image);
    }

    public yusuke (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.YUSUKE, image);
    }

    public zoom (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.ZOOM, image);
    }

    public zuckerberg (image: string): Promise<Buffer> {
      return this.requestImageFromImage(Api.Routes.ZUCKERBERG, image);
    }

    on (event: RequestEvents.Events, listener: (...args: any[]) => void): this {
      super.on(event, listener);
      return this;
    }
}
