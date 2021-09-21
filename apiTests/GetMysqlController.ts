import { AssertionError } from "assert";
import { StringHelper } from "../../helper";
import MysqlConnector from "./MysqlConnector";
import {
  MysqlComponentsEnum, MysqlOptionValue, MysqlRecordObject, MysqlTypeHelper,
} from "./type";
import { ControllerOptions } from "../type";
import { Keys } from "../../type";
import { step } from "../../decorator";
import TypeHelper from "../../helper/TypeHelper";
import { Wait } from "../../component";

export default class GetMysqlController<T extends Record<Keys, unknown>> extends MysqlConnector<T> {
  constructor(
    component: MysqlComponentsEnum,
    protected readonly table: string,
    requestOptions?: ControllerOptions
  ) {
    super(component, requestOptions);
  }

  async execute(query: string): Promise<Array<T>> {
    global.allure.addAsString(`Query to ${this.name} was executed`, query);
    return super.getRecords(query);
  }

  async getRecordsByObject<U extends keyof T>(
    obj: MysqlRecordObject<T>,
    columns?: U[]
  ): Promise<Array<T | Pick<T, U>>> {
    const fields = columns?.length ? columns.join(",") : "*";
    let query = `SELECT ${fields} FROM ${this.table}`;
    if (Object.keys(obj).length) {
      query += ` WHERE ${this.objToQuery(obj)}`;
    }
    return this.getRecords(query);
  }

  async getHexedRecordsByObject<P extends U, U extends keyof T>(
    obj: MysqlRecordObject<T>,
    hexedFields : P[],
    columns?: U[]
  ): Promise<Array<T | Pick<T, U>>> {
    let fields;

    if (columns?.length) {
      const hexed = hexedFields.filter((field) => columns.indexOf(field) !== -1);
      const columnsHex = hexed.map((field) => `LOWER(HEX(${field})) as ${field}` as typeof field);
      fields = [...columns, ...columnsHex].join(",");
    }
    else {
      const columnsWithHex = hexedFields.map((field) => `LOWER(HEX(${field})) as ${field}` as typeof field);
      fields = columnsWithHex.length ? `*,${columnsWithHex.join(",")}` : "*";
    }

    let query = `SELECT ${fields} FROM ${this.table}`;
    if (Object.keys(obj).length) {
      query += ` WHERE ${this.objToQuery(obj)}`;
    }
    return this.getRecords(query);
  }

  @step(function (this: GetMysqlController<T>) {
    return `Should be one record in ${this.name} by query`;
  })
  async shouldBeOneHexedRecordByObj<P extends U, U extends keyof T>(
    obj: MysqlRecordObject<T>,
    hexedColumns: P[],
    columns? : U[]
  ) {
    const records = await this.getHexedRecordsByObject(obj, hexedColumns, columns);
    if (!records.length) {
      const message = `Record by ${StringHelper.stringify(obj)} hasn't found in ${this.name}`;
      throw new AssertionError({ actual: 0, expected: 1, message });
    }
    if (records.length > 1) {
      const message = `Records by ${StringHelper.stringify(obj)} have found more than one in ${this.name}`;
      throw new AssertionError({
        actual: records.length,
        expected: 1,
        message,
      });
    }
    return records[0];
  }

  @step(function (this: GetMysqlController<T>) {
    return `Should be one record in ${this.name} by query`;
  })
  async shouldBeOneHexedRecordWithFields<P extends U, U extends keyof T>(
    obj: MysqlRecordObject<T>,
    hexedFields: P[],
    fields: U[]
  ): Promise<Pick<T, U>> {
    return this.shouldBeOneHexedRecordByObj(obj, hexedFields, fields);
  }

  @step(function (this: GetMysqlController<T>) {
    return `Should be one record in ${this.name} by query`;
  })
  async shouldBeOneHexedRecordWithoutFields<P extends keyof T, U extends keyof T>(
    obj: MysqlRecordObject<T>,
    hexedFields: P[],
    fields: U[]
  ): Promise<Omit<T, U>> {
    const columns = await this.getColumns(fields);
    return this.shouldBeOneHexedRecordByObj(obj, hexedFields, columns);
  }

  async getRecordsByObjectWithFields<U extends keyof T>(
    obj: MysqlRecordObject<T>,
    ...fields: U[]
  ): Promise<Array<Pick<T, U>>> {
    return this.getRecordsByObject(obj, fields);
  }

  async getRecordsByObjectWithoutFields<U extends keyof T>(
    obj: MysqlRecordObject<T>,
    ...fields: U[]
  ): Promise<Array<Omit<T, U>>> {
    const columns = await this.getColumns(fields);
    return this.getRecordsByObject(obj, columns);
  }

  async getColumns(columns: (keyof T)[]) {
    const start = `SELECT GROUP_CONCAT(COLUMN_NAME) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='${this.table}' AND COLUMN_NAME NOT IN (`;
    const end = ") ORDER BY ORDINAL_POSITION;";
    const result = start + columns.map((item) => `'${item}'`).join(",") + end;
    const records = await this.getRecords(result);
    const value = records[0]["GROUP_CONCAT(COLUMN_NAME)"] as string;
    if (value === null) {
      const message = "Should be minimum one column for return";
      throw new AssertionError({ actual: 0, expected: 1, message });
    }
    return value.split(",") as (keyof T)[];
  }

  @step(function (this: GetMysqlController<T>) {
    return `Should be one record in ${this.name} by query`;
  })
  async shouldBeOneRecordByObj<U extends keyof T>(obj: MysqlRecordObject<T>, columns?: U[]) {
    const records = await this.getRecordsByObject(obj, columns);
    if (!records.length) {
      const message = `Record by ${StringHelper.stringify(obj)} hasn't found in ${this.name}`;
      throw new AssertionError({ actual: 0, expected: 1, message });
    }
    if (records.length > 1) {
      const message = `Records by ${StringHelper.stringify(obj)} have found more than one in ${this.name}`;
      throw new AssertionError({
        actual: records.length,
        expected: 1,
        message,
      });
    }
    return records[0];
  }

  @step(function (this: GetMysqlController<T>) {
    return `Should be one record in ${this.name} by query`;
  })
  async shouldBeOneRecordWithFields<U extends keyof T>(
    obj: MysqlRecordObject<T>,
    ...fields: U[]
  ): Promise<Pick<T, U>> {
    return this.shouldBeOneRecordByObj(obj, fields);
  }

  @step(function (this: GetMysqlController<T>) {
    return `Should be one record in ${this.name} by query`;
  })
  async shouldBeOneRecordWithoutFields<U extends keyof T>(
    obj: MysqlRecordObject<T>,
    ...fields: U[]
  ): Promise<Omit<T, U>> {
    const columns = await this.getColumns(fields);
    return this.shouldBeOneRecordByObj(obj, columns);
  }

  @step(function (this: GetMysqlController<T>) {
    return `Wait one record in ${this.name} by query`;
  })
  async waitOneRecord(
    query: MysqlRecordObject<T>,
    ms = 4000
  ): Promise<T> {
    const message = `Record ${this.name} by ${StringHelper.stringify(query)} should be one`;
    const func = async () => {
      const record = await this.shouldBeOneRecordByObj(query);
      return record;
    };
    return new Wait(ms)
      .waitForNotErrorReturnActual(func, message);
  }

  @step(function (this: GetMysqlController<T>) {
    return `Wait one record in ${this.name} by query`;
  })
  async waitOneRecordWithFields<U extends keyof T>(
    query: MysqlRecordObject<T>,
    ms = 4000,
    ...fields: U[]
  ): Promise<Pick<T, U>> {
    const message = `Record ${this.name} by ${StringHelper.stringify(query)} should be one`;
    const func = async () => {
      const record = await this.shouldBeOneRecordWithFields(query, ...fields);
      return record;
    };
    return new Wait(ms)
      .waitForNotErrorReturnActual(func, message);
  }

  @step(function (this: GetMysqlController<T>) {
    return `Wait one record in ${this.name} by query`;
  })
  async waitOneRecordWithoutFields<U extends keyof T>(
    query: MysqlRecordObject<T>,
    ms = 4000,
    ...fields: U[]
  ): Promise<Omit<T, U>> {
    const message = `Record ${this.name} by ${StringHelper.stringify(query)} should be one`;
    const func = async () => {
      const record = await this.shouldBeOneRecordWithoutFields(query, ...fields);
      return record;
    };
    return new Wait(ms)
      .waitForNotErrorReturnActual(func, message);
  }

  @step(function (this: GetMysqlController<T>) {
    return `Wait for so many records in ${this.name} by query`;
  })
  async waitForSoManyRecords(
    query: MysqlRecordObject<T>,
    expectedAmount: number,
    ms = 4000
  ): Promise<void> {
    const message = `Amount records from ${this.name} by ${StringHelper.stringify(query)} doesn't equal ${expectedAmount}`;
    const func = async () => {
      const records = await this.getRecordsByObject(query);
      return records.length;
    };
    await new Wait(ms)
      .waitForEqualWithError(func.bind(this), expectedAmount, message);
  }

  @step(function (this: GetMysqlController<T>) {
    return `Wait none record in ${this.name} by query`;
  })
  async waitNoneRecord(
    query: MysqlRecordObject<T>,
    ms = 4000
  ) {
    await Wait.wait(ms);
    return this.waitForSoManyRecords(query, 0, 0);
  }

  protected objToQuery(obj: MysqlRecordObject<T>): string {
    return Object.entries(obj)
      .reduce((acc: string[], [key, value]) => {
        if (TypeHelper.determineIfString(value) && /^unhex/g.test(value)) {
          acc.push(`${key} = ${value}`);
        }
        else if (value === null) {
          acc.push(`${key} is null`);
        }
        else if (MysqlTypeHelper.determineOptionType(value)) {
          acc.push(this.getQueryByOption(key, value));
        }
        else {
          acc.push(`${key} = "${value}"`);
        }
        return acc;
      }, []).join(" AND ");
  }

  // eslint-disable-next-line consistent-return
  protected getQueryByOption(key: keyof T, obj: MysqlOptionValue) {
    switch (obj.type) {
      case "LIKE": {
        return `${key} LIKE "%${obj.value}%"`;
      }
      case "IN": {
        return `${key} IN (${Array.isArray(obj.value) ? obj.value.map((item) => `'${item}'`).join(",") : obj.value})`;
      }
      case "NOT IN": {
        return `${key} NOT IN (${Array.isArray(obj.value) ? obj.value.map((item) => `'${item}'`).join(",") : obj.value})`;
      }
    }
  }

  protected get name(): string {
    return `mysql.${this.component}.${this.table}`;
  }
}
