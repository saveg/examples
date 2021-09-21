import type { Page } from "playwright";
import { UrlHelper } from "@qa/shell-ts/lib/helper";
import { step } from "@qa/shell-ts/lib/decorator";
import { Wait } from "@qa/shell-ts/lib/component";
import Base from "../base/Base";
import BrowserHelper from "../helper/BrowserHelper";
import { TCaughtRequestParams } from "../type/TCaughtRequestParams";
import { ERequestMethod } from "../type/ERequestMethod";

export default class Catcher extends Base {
  constructor(private page: Page) {
    super();
  }

  @step(((params: Object) => `Catch request by ${JSON.stringify(params)}'`))
  async catchRequest<T extends Record<string, unknown>, U>(
    params: TCaughtRequestParams<T>,
    emitFunc: (...args: U[]) => Promise<void>,
    ms = 4000,
    ...emitFuncParams: U[]
  ): Promise<T> {
    await BrowserHelper.stopSW(this.page);

    const [requestData] = await Promise.race([
      Promise.all([
        this.getCatchPromise(params),
        emitFunc(...emitFuncParams),
      ]),
      this.getTimeout(`Request of ${params.path} wasn't caught`, ms),
    ]) as [T, unknown];
    await BrowserHelper.startSW(this.page);
    global.allure.addObject("Caught request data", requestData);
    return requestData;
  }

  @step()
  async catchPopup<U>(
    emitFunc: (...args: U[]) => Promise<void>,
    ms = 4000,
    expectedPath = "",
    ...emitFuncParams: U[]
  ): Promise<Page> {
    const [popup] = await Promise.race([
      Promise.all([
        new Wait(2 * ms).waitForNotErrorReturnActual(async () => {
          const page = await this.page.waitForEvent("popup");
          if (page.url().includes(expectedPath)) {
            return page;
          }
          throw new Error("next iteration");
        }, ""),
        emitFunc(...emitFuncParams),
      ]),
      this.getTimeout("Popup wasn't caught", ms)]) as [Page, unknown];
    return popup;
  }

  private getCatchPromise<T>(params: TCaughtRequestParams<T>): Promise<T> {
    const {
      path,
      method = ERequestMethod.post,
      callback = (request) => {
        let requestData;
        switch (method) {
          case "GET": {
            requestData = new UrlHelper(request.url()).query;
            break;
          }
          default: {
            const postData = request.postData();
            requestData = JSON.parse(postData || "{}");
            break;
          }
        }
        return requestData as T;
      },
    } = params;
    return new Promise((resolve) => this.page.on(
      "request",
      // eslint-disable-next-line consistent-return
      (request) => {
        if (request.method() === method && request.url().includes(path)) {
          return resolve(callback(request));
        }
      }
    ));
  }

  private getTimeout(message = "Timeout error", ms = 4000) {
    return new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error(message));
      }, ms);
    });
  }
}
