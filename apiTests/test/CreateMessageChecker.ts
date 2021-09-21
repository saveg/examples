import { assert } from "chai";
import { MongoObjectConverter } from "@qa/shell-ts/lib/component";
import { FixtureHelper, MongoHelper } from "@qa/shell-ts/lib/helper";
import { TWpMessageDb } from "@qa/shell-wp/lib/type/mongo/TWpMessageDb";
import { TWebPushMessageAction } from "@qa/shell-wp/lib/type/TWebPushMessageAction";
import { TWebPushMessageActionDb } from "@qa/shell-wp/lib/type/TWebPushMessageActionDb";
import { TCreateWpMessage } from "@qa/pact/lib/uncle-f-front--rest-api/type/webpushMessage";
import BaseChecker from "../BaseChecker";

export default class CreateMessageChecker extends BaseChecker {
  async checkCreate(testData: TCreateWpMessage, startTime: Date) {
    const connector = await this.initMongoConnector();
    const messageRecord = await connector.message.shouldBeOneRecordWithoutFields(
      { name: testData.name },
      "_id",
      "__v"
    );
    const clearRecord = new FixtureHelper(messageRecord).removeProps(
      "createdAt",
      "updatedAt",
      "actions"
    );
    const expectedRecord = this.getExpectedRecord(testData);
    assert.deepEqual(
      MongoObjectConverter.fromMongoToJs(clearRecord),
      MongoObjectConverter.fromMongoToJs(expectedRecord),
      "Message group mongo record"
    );
    this.checkActions(messageRecord.actions, testData.actions);
    this.checkTimeFieldsAfter(messageRecord, ["createdAt", "updatedAt"], startTime, "Message group");
  }

  async checkUpdate(testData: TCreateWpMessage, id: string, startTime: Date) {
    const connector = await this.initMongoConnector();
    const messageRecord = await connector.message.shouldBeOneRecordWithoutFields(
      { _id: MongoHelper.getMongoId(id) },
      "_id",
      "createdAt",
      "__v"
    );
    const clearRecord = new FixtureHelper(messageRecord).removeProps("updatedAt", "actions");
    const expectedRecord = this.getExpectedRecord(testData);
    assert.deepEqual(
      MongoObjectConverter.fromMongoToJs(clearRecord),
      MongoObjectConverter.fromMongoToJs(expectedRecord),
      "Motivation Content mongo record"
    );
    this.checkActions(messageRecord.actions, testData.actions);
    this.checkTimeFieldsAfter(messageRecord, ["updatedAt"], startTime, "Message");
  }

  async checkCreateAndNotUpdate(testData: TCreateWpMessage, id: string, startTime: Date) {
    const connector = await this.initMongoConnector();
    const updatedRecord = await connector.message.shouldBeOneRecord(
      { _id: MongoHelper.getMongoId(id) }
    );
    this.checkTimeFieldsBefore(updatedRecord, ["updatedAt"], startTime, "Message");
    await this.checkCreate(testData, startTime);
  }

  private getExpectedRecord(data: TCreateWpMessage): Partial<TWpMessageDb> {
    return {
      name: data.name,
      timeToLive: data.timeToLive,
      isActive: true,
      title: data.title,
      body: data.body,
      image: data.image,
      icon: data.icon,
      badge: data.badge ?? "",
      clickUrl: data.clickUrl,
      customAttributes: this.createCustomAttributesObject(data.customAttributes),
      tag: data.tag,
      isDeleted: false,
    };
  }

  private checkActions(actions: TWebPushMessageActionDb[], expected: TWebPushMessageAction[]) {
    actions.forEach((action, idx) => {
      assert.deepEqual(
        new FixtureHelper(action).removeProps("_id"),
        expected[idx],
        "Actions"
      );
    });
  }

  private createCustomAttributesObject(str: string): Record<string, any> {
    const result: Record<string, any> = {};
    const parse = str.match(/([^&]+)/g);
    if (parse) {
      parse.forEach((item) => {
        const [key, value] = item.split("=");
        result[key] = value;
      });
    }
    return result;
  }
}
