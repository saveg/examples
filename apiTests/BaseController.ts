import { LogGot } from "../component";
import { ControllerOptions } from "./type";

export default class BaseController {
  constructor(private readonly requestOptions?: ControllerOptions) {}

  protected get request(): LogGot {
    return new LogGot()
      .baseUrl(this.requestOptions?.baseUrl)
      .baseAuth(this.requestOptions?.baseAuthData)
      .bearerToken(this.requestOptions?.bearerToken)
      .cookies(this.requestOptions?.cookies)
      .headers(this.requestOptions?.headers);
  }
}
