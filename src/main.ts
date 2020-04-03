import { AUTH_PROPERTY_PATH } from "./auth";
import { Entry, GetConfigRequest, GetDataRequest, GetDataResponse, GetDataRows, GetSchemaRequest, GetSchemaResponse, Tag, Workspace, DetailsResponse } from "./global";

const cc = DataStudioApp.createCommunityConnector();

const userProperties = PropertiesService.getUserProperties();

const USER_AGENT = "TOGGL_DATA_STUDIO_CONNECTOR";

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
      method: "get",
      muteHttpExceptions: true,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Utilities.base64Encode(`${key}:api_token`)}`,
      },
    }
  ).getContentText());

  return workspaces;
}

function fetchTags(workspace: string): Tag[] {
  const key = userProperties.getProperty(AUTH_PROPERTY_PATH);

  if (key === null) {
    cc.newUserError()
      .throwException();

    throw new Error();
  }

  const tags: Tag[] = JSON.parse(UrlFetchApp.fetch(
    `https://www.toggl.com/api/v8/workspaces/${workspace}/tags`,
    {
      method: "get",
      muteHttpExceptions: true,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Utilities.base64Encode(`${key}:api_token`)}`,
      },
    }
  ).getContentText());

  return tags;
}

function fetchPage(
  key: string,
  workspace: string,
  start: string,
  end: string,
  page: number = 1
): DetailsResponse {
  return JSON.parse(UrlFetchApp.fetch(
    `https://toggl.com/reports/api/v2/details?user_agent=${USER_AGENT}&workspace_id=${workspace}&since=${start}&until=${end}&page=${page}`,
    {
      method: "get",
      muteHttpExceptions: true,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Utilities.base64Encode(`${key}:api_token`)}`,
      },
    }
  ).getContentText());
}

function fetchEntries(workspace: string, start: string, end: string): Entry[] {
  const key = userProperties.getProperty(AUTH_PROPERTY_PATH);
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (key === null) {
    cc.newUserError()
      .throwException();

    throw new Error();
  }

  const entries: Entry[] = [];

  let page = 1;
  let response: DetailsResponse;

  do {
    response = fetchPage(
      key,
      workspace,
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
      page
    );
    entries.push(...response.data);
    page++;
  } while (response.data.length === 50);

  return entries;
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

  config.setDateRangeRequired(true);

  return config.build();
}

function getFields(workspace: string): GoogleAppsScript.Data_Studio.Fields {
  const fields = cc.getFields();
  const types = cc.FieldType;
  const aggregations = cc.AggregationType;

  // Dimensions

  fields.newDimension()
    .setId("id")
    .setName("ID")
    .setType(types.NUMBER);

  fields.newDimension()
    .setId("pid")
    .setName("Project ID")
    .setType(types.NUMBER);

  fields.newDimension()
    .setId("tid")
    .setName("Task ID")
    .setType(types.NUMBER);

  fields.newDimension()
    .setId("uid")
    .setName("User ID")
    .setType(types.NUMBER);

  fields.newDimension()
    .setId("description")
    .setName("Description")
    .setType(types.TEXT);

  fields.newDimension()
    .setId("start")
    .setName("Start Time")
    .setType(types.YEAR_MONTH_DAY_SECOND);

  fields.newDimension()
    .setId("end")
    .setName("End Time")
    .setType(types.YEAR_MONTH_DAY_SECOND);

  fields.newDimension()
    .setId("updated")
    .setName("Updated Time")
    .setType(types.YEAR_MONTH_DAY_SECOND);

  fields.newDimension()
    .setId("user")
    .setName("User")
    .setType(types.TEXT);

  fields.newDimension()
    .setId("use_stop")
    .setName("Use Stop")
    .setType(types.BOOLEAN);

  fields.newDimension()
    .setId("client")
    .setName("Client")
    .setType(types.TEXT);

  fields.newDimension()
    .setId("project")
    .setName("Project")
    .setType(types.TEXT);

  fields.newDimension()
    .setId("project_color")
    .setName("Project Color")
    .setType(types.TEXT);

  fields.newDimension()
    .setId("project_hex_color")
    .setName("Project Hex Color")
    .setType(types.TEXT);

  fields.newDimension()
    .setId("task")
    .setName("Task")
    .setType(types.TEXT);

  fields.newDimension()
    .setId("is_billable")
    .setName("Is Billable")
    .setType(types.BOOLEAN);

  const tags = fetchTags(workspace);

  tags.forEach(tag => {
    fields.newDimension()
      .setId(`tag:${tag.name}`)
      .setName(`Tag: ${tag.name}`)
      .setType(types.BOOLEAN);
  });

  // Metrics

  fields.newMetric()
    .setId("dur")
    .setName("Duration")
    .setType(types.DURATION);

  fields.newMetric()
    .setId("billable")
    .setName("Billed Amount")
    .setType(types.CURRENCY_AUD);

  return fields;
}

// https://developers.google.com/datastudio/connector/reference#getschema
export function getSchema(request: GetSchemaRequest): GetSchemaResponse {
  const fields = getFields(request.configParams.workspace_id);

  return cc
    .newGetSchemaResponse()
    .setFields(fields)
    .build();
}

function responseToRows(entries: Entry[]): GetDataRows {
  return [];
}

// https://developers.google.com/datastudio/connector/reference#getdata
export function getData(request: GetDataRequest): GetDataResponse {
  const workspace = request.configParams?.workspace;
  const startDate = request.dateRange?.startDate;
  const endDate = request.dateRange?.endDate;

  if (
    workspace === undefined ||
    startDate === undefined ||
    endDate === undefined
  ) {
    cc.newUserError()
      .throwException();

    throw new Error();
  }

  const requestedFieldIds = request.fields.map(field => field.name);
  const requestedFields = getFields(workspace).forIds(requestedFieldIds);

  const entries = fetchEntries(workspace, startDate, endDate);
  const rows = responseToRows(entries);

  return {
    schema: requestedFields.build(),
    rows: rows,
  };
}
