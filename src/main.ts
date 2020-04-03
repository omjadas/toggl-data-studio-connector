import { GetConfigRequest, GetDataRequest, GetDataResponse, GetDataRows, GetSchemaRequest, GetSchemaResponse, Workspace } from "./global";
import { AUTH_PROPERTY_PATH } from "./auth";

const cc = DataStudioApp.createCommunityConnector();

const scriptProperties = PropertiesService.getScriptProperties();
const userProperties = PropertiesService.getUserProperties();

function fetchWorkspaces(): Workspace[] {
  const key = userProperties.getProperty(AUTH_PROPERTY_PATH);

  if (key === null) {
    cc.newUserError()
      .throwException();

    throw new Error();
  }

  const workspaces: Workspace[] = JSON.parse(UrlFetchApp.fetch(
    "https://www.toggl.com/api/v8/workspaces",
    {
      muteHttpExceptions: true,
      headers: {
        "Authorization": `Basic ${Utilities.base64Encode(key)}`,
      },
    }
  ).getContentText());

  return workspaces;
}

// https://developers.google.com/datastudio/connector/reference#getconfig
export function getConfig(
  _request: GetConfigRequest
): GoogleAppsScript.Data_Studio.Config {
  const config = cc.getConfig();

  config.newInfo()
    .setId("workspace_id_info")
    .setText("Select a workspace to fetch your entries.");

  const selectSingle = config.newSelectSingle()
    .setId("workspace_id")
    .setName("Workspace")
    .setAllowOverride(true)
    .setHelpText("Choose a workspace you wish to fetch time entries for.");

  const workspaces = fetchWorkspaces();

  workspaces.forEach(workspace => {
    const option = config.newOptionBuilder()
      .setLabel(workspace.name)
      .setValue(workspace.id.toString());

    selectSingle.addOption(option);
  });

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
