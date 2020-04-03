// Adapted from: https://github.com/googledatastudio/example-connectors/blob/master/npm-downloads-ts/src/global.d.ts

// getAuthType
export type GetAuthTypeResponse = Record<string, any>;

// getSchema
export interface GetSchemaRequest {
  configParams: ConfigParams,
}

export interface GetSchemaResponse {
  schema: Record<string, any>[],
}

// getConfig
export interface GetConfigRequest {
  languageCode: string,
  configParams?: Record<string, any>,
}

export type GetConfigResponse = Record<string, any>;

// getData
export interface ConfigParams {
  [configId: string]: string,
}

export enum Type {
  INCLUDE = "INCLUDE",
  EXCLUDE = "EXCLUDE",
}

export enum DimensionOperator {
  EQUALS = "EQUALS",
  CONTAINS = "CONTAINS",
  REGEXP_PARTIAL_MATCH = "REGEXP_PARTIAL_MATCH",
  REGEXP_EXACT_MATCH = "REGEXP_EXACT_MATCH",
  IN_LIST = "IN_LIST",
  IS_NULL = "IS_NULL",
  BETWEEN = "BETWEEN",
  NUMERIC_GREATER_THAN = "NUMERIC_GREATER_THAN",
  NUMERIC_GREATER_THAN_OR_EQUAL = "NUMERIC_GREATER_THAN_OR_EQUAL",
  NUMERIC_LESS_THAN = "NUMERIC_LESS_THAN",
  NUMERIC_LESS_THAN_OR_EQUAL = "NUMERIC_LESS_THAN_OR_EQUAL",
}

export interface DimensionsFilter {
  fieldName: string,
  values: any[],
  type: Type,
  operator: DimensionOperator,
}

export interface GetDataRequest {
  configParams?: ConfigParams,
  scriptParams: {
    sampleExtraction: boolean,
    lastRefresh: string,
  },
  dateRange?: {
    startDate: string,
    endDate: string,
  },
  fields: {
    name: string,
    forFilterOnly: boolean,
  }[],
  dimensionsFilters?: DimensionsFilter[][],
}

export type GetDataRowValue = string | number | boolean | null;

export interface GetDataRow {
  values: GetDataRowValue[],
}

export type GetDataRows = GetDataRow[];

export interface GetDataResponse {
  schema: Record<string, any>[],
  rows: GetDataRows,
  filtersApplied?: boolean,
}

// setCredentials
export interface UserPassCredentials {
  userPass: {
    username: string,
    password: string,
  },
}

export interface UserTokenCredentials {
  userToken: {
    username: string,
    token: string,
  },
}

export interface KeyCredentials {
  key: string,
}

export type SetCredentialsRequest =
  | UserPassCredentials
  | UserTokenCredentials
  | KeyCredentials;

export interface SetCredentialsResponse {
  errorCode: "NONE" | "INVALID_CREDENTIALS",
}
