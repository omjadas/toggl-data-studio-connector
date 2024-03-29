import { KeyCredentials } from "./global";

const cc = DataStudioApp.createCommunityConnector();

const ADMINS_PROPERTY_PATH = "ADMIN_USERS";
const AUTH_PROPERTY_PATH = "TOGGL_KEY";

const scriptProperties = PropertiesService.getScriptProperties();
const userProperties = PropertiesService.getUserProperties();

export { AUTH_PROPERTY_PATH };

// https://developers.google.com/datastudio/connector/reference#isadminuser
export function isAdminUser(): boolean {
  const email = Session.getEffectiveUser().getEmail();
  const admins = scriptProperties.getProperty(ADMINS_PROPERTY_PATH);

  if (admins !== null) {
    const adminArray = admins.split(",").map(email => email.trim());
    if (adminArray.indexOf(email) > -1) {
      return true;
    }
  }

  return false;
}

function validateCredentials(key: string): boolean {
  const res = UrlFetchApp.fetch(
    "https://api.track.toggl.com/api/v8/workspaces",
    {
      method: "get",
      muteHttpExceptions: true,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Utilities.base64Encode(`${key}:api_token`)}`,
      },
    }
  );

  if (res.getResponseCode() === 200) {
    return true;
  }
  return false;
}

export function getAuthType(
): GoogleAppsScript.Data_Studio.GetAuthTypeResponse {
  return cc
    .newAuthTypeResponse()
    .setAuthType(cc.AuthType.KEY)
    .build();
}

// https://developers.google.com/datastudio/connector/auth#isauthvalid
export function isAuthValid(): boolean {
  const key = userProperties.getProperty(AUTH_PROPERTY_PATH);

  if (key !== null) {
    return validateCredentials(key);
  } else {
    return false;
  }
}

// https://developers.google.com/datastudio/connector/auth#setcredentials
export function setCredentials(request: KeyCredentials): { errorCode: string } {
  const key = request.key;

  const validKey = validateCredentials(key);
  if (!validKey) {
    return {
      errorCode: "INVALID_CREDENTIALS",
    };
  }

  userProperties.setProperty(AUTH_PROPERTY_PATH, key);

  return {
    errorCode: "NONE",
  };
}

// https://developers.google.com/datastudio/connector/auth#resetauth
export function resetAuth(): void {
  userProperties.deleteProperty(AUTH_PROPERTY_PATH);
}
