import { AUTH_PROPERTY_PATH } from "./auth";
import { DetailsResponse, Entry, GetConfigRequest, GetDataRequest, GetDataResponse, GetDataRows, GetSchemaRequest, GetSchemaResponse, Tag, Workspace, GetDataRowValue } from "./global";

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
    "https://api.track.toggl.com/api/v8/workspaces",
    {
      method: "get",
      muteHttpExceptions: false,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Utilities.base64Encode(`${key}:api_token`)}`,
      },
    }
  ).getContentText()) as Workspace[];

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
    `https://api.track.toggl.com/api/v8/workspaces/${workspace}/tags`,
    {
      method: "get",
      muteHttpExceptions: false,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Utilities.base64Encode(`${key}:api_token`)}`,
      },
    }
  ).getContentText()) as Tag[];

  return tags;
}

function fetchPage(
  key: string,
  workspace: string,
  start: string,
  end: string,
  page: number = 1
): GoogleAppsScript.URL_Fetch.HTTPResponse {
  return UrlFetchApp.fetch(
    `https://api.track.toggl.com/reports/api/v2/details?user_agent=${USER_AGENT}&workspace_id=${workspace}&since=${start}&until=${end}&page=${page}`,
    {
      method: "get",
      muteHttpExceptions: true,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Utilities.base64Encode(`${key}:api_token`)}`,
      },
    }
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
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
  let response: GoogleAppsScript.URL_Fetch.HTTPResponse;
  let body: DetailsResponse;

  do {
    response = fetchPage(
      key,
      workspace,
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
      page
    );

    let min = 1;
    let max = 3;

    while (response.getResponseCode() === 429) {
      console.warn("Too Many Requests");
      Utilities.sleep(randomInt(min, max));

      response = fetchPage(
        key,
        workspace,
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10),
        page
      );

      min *= 2;
      max *= 2;
    }

    body = JSON.parse(response.getContentText()) as DetailsResponse;
    entries.push(...body.data);
    page++;
  } while (body.data.length === 50);

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
    .setId("start_date")
    .setName("Start Date")
    .setType(types.YEAR_MONTH_DAY)
    .setFormula("DATE($start)");

  fields.newDimension()
    .setId("end")
    .setName("End Time")
    .setType(types.YEAR_MONTH_DAY_SECOND);

  fields.newDimension()
    .setId("end_date")
    .setName("End Date")
    .setType(types.YEAR_MONTH_DAY)
    .setFormula("DATE($end)");

  fields.newDimension()
    .setId("updated")
    .setName("Updated Time")
    .setType(types.YEAR_MONTH_DAY_SECOND);

  fields.newDimension()
    .setId("updated_date")
    .setName("Updated Date")
    .setType(types.YEAR_MONTH_DAY)
    .setFormula("DATE($updated)");

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
      .setId(`tag_${tag.name}`)
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
    .build() as GetSchemaResponse;
}

function isoStringToSimple(time: string): string {
  return time.slice(0, 19).replace(/[-:T]+/g, "");
}

function responseToRows(requestedFieldIds: string[], entries: Entry[]): GetDataRows {
  return entries.map(entry => {
    const row: GetDataRowValue[] = [];

    for (const field of requestedFieldIds) {
      let val: GetDataRowValue;

      if (field.slice(0, 4) === "tag_") {
        val = entry.tags.includes(field.slice(4));
      } else if (field === "dur") {
        val = (entry[field] / 1000).toString();
      } else {
        val = entry[field] as GetDataRowValue;
      }

      if (field === "start" || field === "end" || field === "updated") {
        val = isoStringToSimple(val as string);
      }

      row.push(val);
    }
    return { values: row };
  });
}

// https://developers.google.com/datastudio/connector/reference#getdata
export function getData(request: GetDataRequest): GetDataResponse {
  const workspace = request.configParams?.workspace_id;
  const startDate = request.dateRange?.startDate;
  const endDate = request.dateRange?.endDate;

  if (
    workspace === undefined ||
    startDate === undefined ||
    endDate === undefined
  ) {
    console.error("getData: parameters not set");
    cc.newUserError()
      .throwException();

    throw new Error();
  }

  const requestedFieldIds = request.fields.map(field => field.name);
  const requestedFields = getFields(workspace).forIds(requestedFieldIds);

  let entries: Entry[];
  try {
    entries = fetchEntries(workspace, startDate, endDate);
  } catch (e: unknown) {
    console.error(`getData: ${(e as Error).message}`);
    cc.newUserError()
      .throwException();

    throw new Error();
  }

  const rows = responseToRows(requestedFieldIds, entries);

  return {
    schema: requestedFields.build() as Record<string, any>[],
    rows: rows,
  };
}
