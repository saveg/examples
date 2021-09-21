import { Response } from "got";
import { AssertionError } from "assert";
import * as querystring from "querystring";
import GotBase from "./GotBase";
import { GotHelper, Helper, TypeHelper } from "../../helper";
import { GotOptions, RequestMethod, ResponseData } from "../type";
import { Keys } from "../../type";

export default class LogGot extends GotBase {
  async get<T>(pathname: string): Promise<ResponseData<T>> {
    return this.makeSuccess<T>(pathname, RequestMethod.get);
  }

  async post<T>(pathname: string): Promise<ResponseData<T>> {
    return this.makeSuccess<T>(pathname, RequestMethod.post);
  }

  async put<T>(pathname: string): Promise<ResponseData<T>> {
    return this.makeSuccess<T>(pathname, RequestMethod.put);
  }

  async delete<T>(pathname: string): Promise<ResponseData<T>> {
    return this.makeSuccess<T>(pathname, RequestMethod.delete);
  }

  async getError<T>(pathname: string): Promise<ResponseData<T>> {
    return this.makeError<T>(pathname, RequestMethod.get);
  }

  async postError<T>(pathname: string): Promise<ResponseData<T>> {
    return this.makeError<T>(pathname, RequestMethod.post);
  }

  async putError<T>(pathname: string): Promise<ResponseData<T>> {
    return this.makeError<T>(pathname, RequestMethod.put);
  }

  async deleteError<T>(pathname: string): Promise<ResponseData<T>> {
    return this.makeError<T>(pathname, RequestMethod.delete);
  }

  private async makeError<T>(pathname: string, method: RequestMethod): Promise<ResponseData<T>> {
    const responseData = await this.makeRequest<T>(pathname, method);
    if (responseData.statusCode < 400) {
      throw new AssertionError({
        message: "StatusCode should be 4xx or 5xx",
        actual: responseData.statusCode,
        expected: "4xx, 5xx",
      });
    }
    return responseData;
  }

  private async makeSuccess<T>(pathname: string, method: RequestMethod): Promise<ResponseData<T>> {
    const responseData = await this.makeRequest<T>(pathname, method);
    if (responseData.statusCode > 399) {
      throw new AssertionError({
        message: "StatusCode should be 1xx, 2xx or 3xx",
        actual: responseData.statusCode,
        expected: "1xx, 2xx, 3xx",
      });
    }
    return responseData;
  }

  private async makeRequest<T>(pathname: string, method: RequestMethod): Promise<ResponseData<T>> {
    this.method(method);
    this.pathname(pathname);
    const options = this.getOption();
    this.logRequest(options);
    const response = await this.send(options);
    this.logResponse(response);
    const { statusCode, body: nativeBody, headers } = response;
    const body: T = GotHelper.parseBody<T>(nativeBody as unknown as string);
    return {
      statusCode, body, headers, response,
    };
  }

  private logRequest(options: GotOptions) {
    this.createCurl(options);
    global.allure.addObject("Request Options", this.transformOptionForLog(options));
    global.allure.addText("curl", this.curl ?? "empty curl");
  }

  private logResponse(response: Response) {
    const {
      body, headers, request, statusCode,
    } = response;
    global.allure.addObject(
      "Native request",
      GotHelper.stripRequest(request)
    );
    global.allure.addObject(
      "Response",
      {
        statusCode,
        body: GotHelper.parseBody(body as string),
        headers,
      }
    );
  }

  private transformOptionForLog(options: GotOptions): Record<Keys, unknown> {
    const cloneOptions = Helper.clone(options) as Record<Keys, unknown>;
    if (cloneOptions.search && TypeHelper.determineIfString(cloneOptions.search)) {
      cloneOptions.search = querystring.parse(cloneOptions.search);
    }
    return cloneOptions;
  }
}
