import { step } from "@qa/shell-ts/lib/decorator";
import type { Page } from "playwright";
import { IElement } from "../type/interface/IElement";
import Base from "./Base";
import WebElement from "./WebElement";

export default class ParentComponent extends Base implements IElement {
  protected page: Page;

  protected requiredElements: Array<IElement>;

  constructor(public root: WebElement) {
    super();
    this.page = root.page;
    this.requiredElements = [];
  }

  getChildElement(selector: string) {
    return new WebElement(
      this.page,
      this.getChildSelector(selector)
    );
  }

  getChildElementByIndex(selector: string, index: number) {
    return new WebElement(
      this.page,
      this.getChildSelectorByIndex(selector, index)
    );
  }

  getChildSelector(selector: string) {
    return `${this.root.selector} >> ${selector}`;
  }

  getChildSelectorByIndex(selector: string, index: number) {
    return `${this.getChildSelector(selector)} >> nth=${index}`;
  }

  getLastChildElement(selector: string) {
    return new WebElement(
      this.page,
      `${this.getChildSelector(selector)} >> nth=-1`
    );
  }

  getLastElement(selector: string) {
    return new WebElement(
      this.root.page,
      `${selector} >> nth=-1`
    );
  }

  async getLengthOfChildren(selector: string) {
    return (
      await this.page.$$(this.getChildSelector(selector))
    ).length;
  }

  @step()
  async waitForElement(ms?: number): Promise<true> {
    if (this.requiredElements.length) {
      for (const requiredElement of this.requiredElements) {
        await requiredElement.waitForElement(ms);
      }
      return true;
    }
    return this.root.waitForElement(ms);
  }
}
