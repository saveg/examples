import { step } from "@qa/shell-ts/lib/decorator";
import { NonNullablePrimitive } from "@qa/shell-ts/lib/helper";
import FilterTableHeader from "../element/FilterTableHeader";
import WebElement from "../base/WebElement";
import BaseTable from "../base/BaseTable";
import { TSortingParams } from "../type/TSortingParams";
import { TTransformFiltersParams } from "../type/TTransformFiltersParams";
import { TCatcherParams } from "../type/TCatcherParams";

export default abstract class FilterTable<T extends Record<keyof T, NonNullablePrimitive | string[]>> extends BaseTable<T> {
  private readonly header;

  constructor(root: WebElement, catcherParams: TCatcherParams) {
    const { filterRequestPath, method } = catcherParams;
    super(root);
    this.header = new FilterTableHeader<T>(
      this.getChildElement("//thead"),
      filterRequestPath,
      method
    );
    this.requiredElements = this.requiredElements.concat(this.header);
  }

  override get lineSelector() {
    return "//tbody/tr";
  }

  @step((function (this: FilterTable<T>, filterData: TTransformFiltersParams<T>) {
    return `Filter by ${JSON.stringify(filterData)} for table '${this.root.selector}'`;
  }))
  async filter(filterData: TTransformFiltersParams<T>, ms?: number) {
    return this.header.filter(filterData, this.getMatcher(), ms);
  }

  @step((function (this: FilterTable<T>, sortedData: TSortingParams<T>) {
    return `Sort by ${JSON.stringify(sortedData)} for table '${this.root.selector}'`;
  }))
  async sort(sortingData: TSortingParams<T>) {
    return this.header.sort(sortingData);
  }

  async waitForResponse() {
    return this.header.waitForResponse();
  }
}
