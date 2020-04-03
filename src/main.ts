import { GetConfigRequest, GetDataRequest, GetDataResponse, GetDataRows, GetSchemaRequest, GetSchemaResponse } from "./global";

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
export function getData(request: GetDataRequest): GetDataResponse {
  const requestedFieldIds = request.fields.map(field => field.name);
  const requestedFields = getFields().forIds(requestedFieldIds);

  const rows: GetDataRows = [];

  return {
    schema: requestedFields.build(),
    rows: rows,
  };
}
