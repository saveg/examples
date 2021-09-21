import { BaseController } from "@qa/shell-ts/lib/controller";
import { step } from "@qa/shell-ts/lib/decorator";
import {
  TCreateWpMessage,
  TDeleteWpMessage,
  TFilterWpMessage,
} from "@qa/pact/lib/uncle-f-front--rest-api/type/webpushMessage";
import { NOneMessageGet } from "../namespace/messages/NOneMessageGet";
import { NGetMessages } from "../namespace/messages/NGetMessages";
import { NMessageCreate } from "../namespace/messages/NMessageCreate";
import { NMessageDelete } from "../namespace/messages/NMessageDelete";
import TCreateDataPositive = NMessageCreate.TCreateData;
import TCreateDataNegative = NMessageCreate.TCreateDataNegative;
import TCreateResponseBody = NMessageCreate.TResponseBody;
import TDeleteDataNegative = NMessageDelete.TDeleteDataNegative;
import TDeleteResponseBody = NMessageDelete.TResponseBody;
import TGetOneDataPositive = NOneMessageGet.TExpectedDataPositive;
import TGetOneDataNegative = NOneMessageGet.TExpectedDataNegative;
import TGetResponseDataPositive = NGetMessages.TResponseDataPositive;
import TGetResponseDataNegative = NGetMessages.TResponseDataNegative;

export default class UfMessageController extends BaseController {
  private readonly ufMessagePath: string = "v2/api/webpush/messages";

  @step("Uf Create Message")
  async createMessage(data: TCreateDataPositive) {
    return this.request
      .json(data)
      .post<TCreateResponseBody>(this.ufMessagePath);
  }

  @step("Uf Error Create Message")
  async createErrorMessage(data: TCreateDataNegative) {
    return this.request
      .json(data)
      .postError<TCreateResponseBody>(this.ufMessagePath);
  }

  @step("Uf Delete Message")
  async deleteMessage(data: TDeleteWpMessage) {
    return this.request
      .json(data)
      .delete<TDeleteResponseBody>(this.ufMessagePath);
  }

  @step("Uf Error Delete Message")
  async deleteErrorMessage(data: TDeleteDataNegative) {
    return this.request
      .json(data)
      .deleteError<TDeleteResponseBody>(this.ufMessagePath);
  }

  @step("Uf get Messages")
  async getMessages(pathData: TFilterWpMessage) {
    return this.request
      .searchParams(pathData)
      .get<TGetResponseDataPositive>(this.ufMessagePath);
  }

  @step("Uf error get Messages")
  async getErrorMessages(pathData: TFilterWpMessage) {
    return this.request
      .searchParams(pathData)
      .getError<TGetResponseDataNegative>(this.ufMessagePath);
  }

  @step("Uf get one Message")
  async getOneMessage(id: string) {
    return this.request
      .get<TGetOneDataPositive>(`${this.ufMessagePath}/${id}`);
  }

  @step("Uf error get one Message")
  async getErrorOneMessage(id: string) {
    return this.request
      .getError<TGetOneDataNegative>(`${this.ufMessagePath}/${id}`);
  }

  @step("Uf Update Message")
  async updateMessage(data: TCreateWpMessage, id: string) {
    return this.request
      .json(data)
      .put<TCreateResponseBody>(`${this.ufMessagePath}/${id}`);
  }

  @step("Uf Error Update Message")
  async updateErrorMessage(data: TCreateDataNegative, id: string) {
    return this.request
      .json(data)
      .putError<TCreateResponseBody>(`${this.ufMessagePath}/${id}`);
  }
}
