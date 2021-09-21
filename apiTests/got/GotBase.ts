import got, { Headers, Response } from "got";
import * as queryString from "querystring";
import { Readable } from "stream";
import Helper from "../../helper/Helper";
import StringHelper from "../../helper/StringHelper";
import { GotHelper, TypeHelper } from "../../helper";
import { GotOptions, RequestMethod, SearchParamsType } from "../type";
import { TBaseAuthUserData } from "../../type/TBaseAuthUserData";

export default class GotBase {
  private _cookies: Array<Record<string, string>>;

  protected _options: Array<GotOptions>;

  private _curl: string;

  protected throwHttpErrors: boolean;

  constructor() {
    this._cookies = [];
    this._options = [];
    this._curl = "";
    this.throwHttpErrors = false;
  }

  headers(headers?: Headers): this {
    if (headers) {
      this._options.push({ headers });
    }
    return this;
  }

  bearerToken(bearerToken?: string): this {
    if (bearerToken) {
      const headers: Headers = { Authorization: `Bearer ${bearerToken}` };
      this._options.push({ headers });
    }
    return this;
  }

  baseUrl(prefixUrl?: string): this {
    if (prefixUrl) {
      this._options.push({ prefixUrl });
    }
    return this;
  }

  method(method: RequestMethod): this {
    this._options.push({ method });
    return this;
  }

  pathname(pathname: string): this {
    this._options.push({ pathname });
    return this;
  }

  cookies(cookies?: Record<string, string>): this {
    if (cookies) {
      this._cookies.push(cookies);
    }
    return this;
  }

  form(form: Record<string, unknown>): this {
    this._options.push({ form });
    return this;
  }

  json(json: Record<string, unknown> | Array<unknown>): this {
    this._options.push({ json });
    return this;
  }

  body(body: string | Buffer | Readable): this {
    this._options.push({ body });
    return this;
  }

  formBody(data: Record<string, string | Buffer | Readable | undefined>): this {
    const body = GotHelper.getFormBody(data);
    this._options.push({ body });
    return this;
  }

  searchParams(searchParams: SearchParamsType): this {
    this._options.push({ searchParams });
    return this;
  }

  qs(searchParams: SearchParamsType | string): this {
    const search = TypeHelper.determineIfString(searchParams)
      ? searchParams
      : queryString.stringify(searchParams);
    this._options.push({ search });
    return this;
  }

  baseAuth(userData?: TBaseAuthUserData): this {
    if (userData) {
      const { username, password } = userData;
      this._options.push({
        username,
        password,
      });
    }
    return this;
  }

  option(option: GotOptions): this {
    this._options.push(option);
    return this;
  }

  public async send<T>(options: GotOptions): Promise<Response<T>> {
    return got<T>(options);
  }

  get curl(): string | undefined {
    return this._curl;
  }

  protected getOption(): GotOptions {
    this._options.unshift({
      throwHttpErrors: this.throwHttpErrors,
    });
    if (this._cookies.length) {
      this._options.push({
        headers: {
          cookie: GotHelper.transformObjectToCookies(
            Helper.defaultsDeep({}, ...this._cookies)
          ),
        },
      });
    }
    return Helper.defaultsDeep<GotOptions>({}, ...this._options);
  }

  protected createCurl(options: GotOptions) {
    let {
      prefixUrl,
      pathname,
    } = options;
    const {
      method,
    } = options;
    prefixUrl = TypeHelper.determineIfString(prefixUrl) ? StringHelper.removeSuffix(prefixUrl, "/") : "";
    pathname = TypeHelper.determineIfString(pathname) ? StringHelper.removePrefix(pathname, "/") : "";
    const url = `${prefixUrl}${pathname}`;
    let curlPrefix = "curl";
    const postSuffix = "";

    const headers = options.headers ?? {};
    const qs = (options.searchParams ?? {}) as SearchParamsType;

    let formString = "";

    if (options.form) {
      headers["content-type"] = "application/x-www-form-urlencoded";
      formString = `-d '${Object.entries(options.form)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&")}'`;
    }
    if (options.json) {
      headers["content-type"] = "application/json";
      formString = `-d '${JSON.stringify(options.json)}'`;
    }
    if (options.body) {
      formString = `-d '${options.body}'`;
    }
    const headersString = Object.keys(headers)
      .map((key) => `-H '${key}:${headers[key]}'`)
      .join(" ");
    const qsString = Object.keys(qs)
      .map((key) => `${key}=${qs[key]}`)
      .join("&");
    switch (method) {
      case RequestMethod.put:
      case RequestMethod.post:
      case RequestMethod.delete:
        curlPrefix = `curl -X ${method}`;
        break;
      default:
        break;
    }
    this._curl = `${curlPrefix} '${url}?${qsString}' `
      + `${headersString} ${formString} ${postSuffix}`;
  }
}
