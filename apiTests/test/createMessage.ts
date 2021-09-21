import { assert } from "chai";
import BackApiClient from "../../../../src/client/BackApiClient";
import CreateMessageChecker from "../../../../src/checker/messages/CreateMessageChecker";
import { positive, contractCreate, negative } from "../../../../src/data/fixture/webpushBack/messages/createMessage";

describe("UF. Webpush. Create Message. Positive", function () {
  [...positive, ...contractCreate].forEach(({ name, testData }) => {
    it(`${this.description}. ${name}`, async () => {
      const startTime = new Date();
      const client = await new BackApiClient().authenticate();
      const { statusCode, body } = await client.ufMessage.createMessage(testData);
      assert.equal(statusCode, 200, "Status code");
      assert.deepEqual(body, { data: true }, "Response body");
      await new CreateMessageChecker().checkCreate(testData, startTime);
    });
  });
});

describe("UF. Webpush. Create Message. Negative", function () {
  negative.forEach(({ name, testData, expectedData }) => {
    it(`${this.description}. ${name}`, async () => {
      const client = await new BackApiClient().authenticate();
      const { statusCode, body } = await client.ufMessage.createErrorMessage(testData);
      assert.equal(statusCode, expectedData.statusCode, "Status code");
      assert.deepEqual(body, expectedData.body, "Response body");
    });
  });
});
