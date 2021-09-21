import type { Page } from "playwright";
import { step } from "@qa/shell-ts/lib/decorator";
import { Wait } from "@qa/shell-ts/lib/component";
import ParentComponent from "../base/ParentComponent";
import WebElement from "../base/WebElement";
import MainMenu from "../element/MainMenu";
import { TPageParams } from "../type/TPageParams";

export default class BasePage extends ParentComponent {
  protected readonly url: string;

  private readonly mainMenu: MainMenu;

  constructor(
    page: Page,
    params: TPageParams
  ) {
    super(new WebElement(page, "//*"));
    this.url = `${params.baseUrl}${params.pagePath}`;
    this.mainMenu = new MainMenu(this.root);
    this.requiredElements = this.requiredElements.concat([this.mainMenu]);
  }

  async isOpenUrl() {
    return this.page.url() === this.url;
  }

  async open() {
    await this.page.goto(this.url);
    return this;
  }

  @step(((text: string) => `Select '${text}' menu item`))
  async selectItemOfMenu(text: string): Promise<void> {
    return this.mainMenu.select(text);
  }

  @step(((text: string) => `Select '${text}' menu sub item`))
  async selectSubItemOfMenu(text: string): Promise<void> {
    return this.mainMenu.selectSubItem(text);
  }

  @step((function (this: BasePage) {
    return `Wait for opening of '${this.url}' page`;
  }))
  async shouldBeOpen(ms?: number) {
    await new Wait(ms).waitForTrue(
      this.isOpenUrl.bind(this),
      `Url should be ${this.url}`
    );
    await this.waitForElement(ms);
  }
}
