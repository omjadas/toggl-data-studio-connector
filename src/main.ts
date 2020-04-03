import { GetConfigRequest, GetSchemaRequest, GetSchemaResponse, GetDataRequest } from "./global";

const cc = DataStudioApp.createCommunityConnector();

// https://developers.google.com/datastudio/connector/reference#getconfig
export function getConfig(
  _request: GetConfigRequest
): GoogleAppsScript.Data_Studio.Config {
  const config = cc.getConfig();

  return config.build();
}

function getFields(): GoogleAppsScript.Data_Studio.Fields {
  const fields = cc.getFields();

  return fields;
}

// https://developers.google.com/datastudio/connector/reference#getschema
export function getSchema(_request: GetSchemaRequest): GetSchemaResponse {
  const fields = getFields().build();
  return { schema: fields };
}

// https://developers.google.com/datastudio/connector/reference#getdata
export function getData(
  request: GetDataRequest
): GoogleAppsScript.Data_Studio.GetDataResponse {
}
