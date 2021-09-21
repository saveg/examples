import type { Page } from "playwright";
import { Wait } from "@qa/shell-ts/lib/component";
import { TypeHelper } from "@qa/shell-ts/lib/helper";
import { step } from "@qa/shell-ts/lib/decorator";
import Base from "./Base";
import ParentComponent from "./ParentComponent";
import { IElement } from "../type/interface/IElement";

export default class WebElement extends Base implements IElement {
  constructor(public page: Page, public selector: string) {
    super();
  }

  @step((function (this: WebElement) {
    return `Clear '${this.selector}'`;
  }))
  async clear() {
    await this.click();
    await this.focus();
    await this.page.click(this.selector, { clickCount: 3 });
    return this.page.keyboard.press("Backspace");
  }

  @step((function (this: WebElement) {
    return `Click on '${this.selector}'`;
  }))
  async click() {
    return this.page.click(this.selector);
  }

  @step((function (this: WebElement) {
    return `Double click on '${this.selector}'`;
  }))
  async dblclick() {
    return this.page.dblclick(this.selector);
  }

  @step((function (this: WebElement, eventName: string) {
    return `Dispatch event '${eventName}' '${this.selector}'`;
  }))
  async dispatchEvent(eventName: string) {
    return this.page.dispatchEvent(this.selector, eventName);
  }

  @step((function (this: WebElement, name: string) {
    return `Get attribute '${name}' of '${this.selector}'`;
  }))
  async getAttribute(name: string) {
    return this.page.getAttribute(this.selector, name);
  }

  getChildElement(selector: string) {
    return new ParentComponent(this).getChildElement(selector);
  }

  getChildElementByIndex(selector: string, index: number) {
    return new ParentComponent(this).getChildElementByIndex(selector, index);
  }

  @step((function (this: WebElement) {
    return `Focus on '${this.selector}'`;
  }))
  async focus() {
    return this.page.focus(this.selector);
  }

  @step((function (this: WebElement, text: string) {
    return `Fill '${this.selector}' with '${text}'`;
  }))
  async fill(text: string) {
    return this.page.fill(this.selector, text);
  }

  @step((function (this: WebElement) {
    return `Get inner html of '${this.selector}'`;
  }))
  async innerHtml() {
    return this.page.innerHTML(this.selector);
  }

  @step((function (this: WebElement) {
    return `Get inner text of '${this.selector}'`;
  }))
  async innerText() {
    return this.page.innerText(this.selector);
  }

  @step((function (this: WebElement) {
    return `Is element '${this.selector}' found`;
  }))
  async isElementFound() {
    const element = await this.getElement();
    return !TypeHelper.isNull(element);
  }

  @step((function (this: WebElement) {
    return `Is element '${this.selector}' is visible`;
  }))
  async isVisible() {
    return this.page.isVisible(this.selector);
  }

  @step((function (this: WebElement, key: string) {
    return `Press key '${key}' on '${this.selector}'`;
  }))
  async press(key: string) {
    return this.page.press(this.selector, key);
  }

  @step((function (this: WebElement) {
    return `Get outer html of '${this.selector}'`;
  }))
  async outerHTML() {
    const element = await this.page.waitForSelector(this.selector, { state: "visible" });
    return this.page.evaluate((el) => el.outerHTML, element);
  }

  @step((function (this: WebElement) {
    return `Select options to '${this.selector}'`;
  }))
  async select(...option: Array<string>) {
    return this.page.selectOption(this.selector, option);
  }

  @step((function (this: WebElement, text: string) {
    return `Type '${text}' to '${this.selector}'`;
  }))
  async type(text: string) {
    return this.page.type(this.selector, text);
  }

  @step((function (this: WebElement, filePath: string) {
    return `Upload file '${filePath}' to '${this.selector}'`;
  }))
  async uploadFile(filePath: string) {
    return this.page.setInputFiles(this.selector, filePath);
  }

  @step((function (this: WebElement, text: string) {
    return `User type '${text}' to '${this.selector}'`;
  }))
  async userType(text: string) {
    return this.page.type(this.selector, text, { delay: 10 });
  }

  @step((function (this: WebElement) {
    return `Wait for element '${this.selector}'`;
  }))
  async waitForElement(ms: number = 4000): Promise<true> {
    await new Wait(ms).waitForTrueWithError(
      this.isElementFound.bind(this),
      `Element with selector: "${this.selector}" was not found`
    );
    await new Wait(ms).waitForTrueWithError(
      this.isVisible.bind(this),
      `Element with selector: "${this.selector}" was not visible, but found`
    );
    return true;
  }

  private async getElement() {
    return this.page.$(this.selector);
  }
}
