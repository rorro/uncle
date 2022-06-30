import { google } from 'googleapis';
import config from '../config';

// Service account key file from google cloud console.
const KEYFILE_PATH = './unclebot-credentials.json';
// Add drive scope, will give us full access to Google drive account.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: SCOPES
});

// init drive and sheets services, they will handle all authorization.
const driveService = google.drive({ version: 'v3', auth });
const sheetsService = google.sheets({ version: 'v4', auth });

// Makes a copy of the Legacy Diary sheet
export async function copyDiary(username: string) {
  const fileMetaData = {
    name: `${username} Legacy Diary`,
    parents: [config.googleDrive.diarySheetsFolder]
  };

  try {
    const fileCopyResponse = await driveService.files.copy({
      fileId: config.googleDrive.diarySheet,
      requestBody: fileMetaData
    });
    return fileCopyResponse.data.id;
  } catch (e) {
    console.log(e);
    return '';
  }
}

// Change the permissions of a sheet to make it editable by anyone with link
export async function changePermissions(sheetId: string) {
  await driveService.permissions
    .create({
      fileId: sheetId,
      requestBody: {
        type: 'anyone',
        role: 'writer'
      }
    })
    .catch(console.error);
}

// Gets the amount of tasks completed of the Legacy Diary sheet
export async function getTasksCompleted(sheetId: string, username: string) {
  const values = [[username]];

  const updateUsername = await sheetsService.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: config.googleDrive.diarySheetMainName,
    valueInputOption: 'RAW',
    requestBody: {
      values
    }
  });

  const tasksCompleted = await sheetsService.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: config.googleDrive.diarySheetTasksComplete
  });

  return tasksCompleted.data.values?.at(0)?.pop();
}

// Grab a share link a sheet
export async function getWebViewLink(sheetId: string): Promise<string> {
  const webViewLink = await driveService.files.get({
    fileId: sheetId,
    fields: 'webViewLink'
  });

  if (webViewLink.data.webViewLink) return webViewLink.data.webViewLink;
  else return '';
}

// Fetch the pets data from pets sheet
export async function getPetData(sheetId: string) {
  const topThree = await sheetsService.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: config.googleDrive.petSheetRange
  });

  return topThree.data.values;
}
