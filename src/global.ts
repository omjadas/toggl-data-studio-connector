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

export interface Workspace {
  id: number,
  name: string,
  profile: string,
  premium: boolean,
  admin: boolean,
  default_hourly_rate: number,
  default_currency: string,
  only_admins_may_create_projects: boolean,
  only_admins_see_billable_rate: boolean,
  only_admins_see_team_dashboard: boolean,
  projects_billable_by_default: boolean,
  rounding: number,
  rounding_minutes: number,
  api_token: string,
  at: string,
  logo_url: string,
  ical_url: string,
  ical_enabled: boolean,
}

export interface Tag {
  id: number,
  wid: number,
  name: string,
  at: string,
}

export interface Entry {
  id: number,
  pid: number,
  tid: number,
  uid: number,
  description: string,
  start: string,
  end: string,
  updated: string,
  dur: number,
  user: string,
  use_stop: boolean,
  client: string | null,
  project: string,
  project_color: string,
  project_hex_color: string,
  task: string,
  billable: number,
  is_billable: boolean,
  cur: string,
  tags: string[],
  [key: string]: any,
}

export interface DetailsResponse {
  total_grand: number,
  total_billable: number,
  total_currencies: {
    currency: string,
    amount: number,
  }[],
  total_count: number,
  per_page: number,
  data: Entry[],
}
