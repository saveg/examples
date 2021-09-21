import type { Page } from "playwright";
import { step } from "@qa/shell-ts/lib/decorator";
import { NonNullablePrimitive } from "@qa/shell-ts/lib/helper";
import FilterTable from "../component/FilterTable";
import { TSortingParams } from "../type/TSortingParams";
import { TTransformFiltersParams } from "../type/TTransformFiltersParams";
import { TFilterPageParams } from "../type/TFilterPageParams";
import BasePage from "./BasePage";
import { TPaginationParams } from "../type/TPaginationParams";
import TablePagination from "../component/TablePagination";
import { ERequestMethod } from "../type/ERequestMethod";
import Catcher from "../component/Catcher";

export default abstract class FilterPage<T extends Record<keyof T, NonNullablePrimitive | string[]>> extends BasePage {
  protected readonly getListPath;

  private readonly tablePagination;

  protected readonly getListMethod;

  constructor(
    page: Page,
    params: TFilterPageParams
  ) {
    const {
      baseUrl, pagePath, getListPath, getListMethod = ERequestMethod.get,
    } = params;
    super(page, { baseUrl, pagePath });
    this.getListPath = getListPath;
    this.getListMethod = getListMethod;
    this.tablePagination = new TablePagination(
      this.getChildElement("//*[@data-testid='tablePaginationBlock']"),
      this.paginationMenuSelector
    );
    this.requiredElements = this.requiredElements.concat(this.tablePagination);
  }

  protected abstract get filterTable(): FilterTable<T>;

  protected get paginationMenuSelector() {
    return "//*[contains(@class, 'MuiPopover-paper')]";
  }

  async filter(filterData: TTransformFiltersParams<T>, ms?: number) {
    return this.filterTable.filter(filterData, ms);
  }

  @step((function (this: FilterPage<T>, params: TPaginationParams) {
    return `Pagination ${params.page}-${params.limit} for page '${this.url}'`;
  }))
  async pagination<U extends Record<string, unknown>>(params: TPaginationParams, ms = 4000): Promise<U> {
    if (params.limit) {
      await this.tablePagination.selectAmountPerPage(params.limit);
    }
    await this.filterTable.waitForResponse();
    const isPreviousCase = params.page === "1";
    if (isPreviousCase) {
      await this.tablePagination.goToNextPage();
      await this.filterTable.waitForResponse();
    }
    return new Catcher(this.page).catchRequest(
      {
        path: this.getListPath,
        method: this.getListMethod,
      },
      isPreviousCase
        ? async () => {
          await this.tablePagination.goToPreviousPage();
        }
        : async () => {
          await this.tablePagination.goToNextPage();
        },
      ms
    );
  }

  async sort(sortingData: TSortingParams<T>) {
    return this.filterTable.sort(sortingData);
  }
}
