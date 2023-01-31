<div align = "center">

### **Uncle**

## ![Uncle](https://i.imgur.com/x9I9NPY.png)

I am the official Uncle of the Legacy OSRS Clan

</div>

<br />

#### Suggestions and bugs

Have a suggestion or a bug to report? [Click here to create a issue.](https://github.com/rorro/uncle/issues)

<br />

#### Some notes

This project does some very clan specific things that you will need to heavily modify or comform to, to be able to use the code as is. For this we use the Google Workspace APIs, so you will need to setup access credentials. Find the link in the instructions for running the project. You might also need to configure some variables in `src/config.ts` so it matches your own server if you are going to host this bot for your own clan.

<br />

#### Running the project

1. Create a .env.development file in the root folder of the project folder and add the following to it.

```
DISCORD_TOKEN={discord_bot_token}
CLIENT_ID={discord_bot_id}
CLIENT_SECRET={discord_bot_secret}

GUILD_ID={guild_id}

NEW_MEMBERS_CHANNEL={channel_id}
ASSIGN_ROLES_CHANNEL={channel_id}
RULES_CHANNEL={channel_id}
DIARY_CHANNEL={channel_id}
LEADERBOARD_CHANNEL={channel_id}

APPLICATION_MANAGER_ROLE={role_id}
STAFF_ROLE={role_id}
MEMBER_ROLE={role_id}
PROTECTOR_ROLE={role_id}
BULWARK_ROLE={role_id}
JUSTICIAR_ROLE={role_id}

DIARY_SHEETS_FOLDER={google_drive_folder_id}
DIARY_SHEET={google_sheets_sheet_id}

LEADERBOARD_SHEET={google_sheets_sheet_id}

SPLITS_SHEET={google_sheets_sheet_id}

URL=localhost
PORT=7373

SITE_URL=localhost
SITE_PORT=3000
```

2. For some commands to work, you will need to create access credentials for Google Workspace APIs. Follow [this link](https://developers.google.com/workspace/guides/create-credentials) and create a service account. After creating a servie account, download the credentials as a JSON file, rename the file to `unclebot-credentials.json` and add it to the root folder of the project.

3. Run the project using `npm i` and then `npm run dev`

<br />

#### Related projects

[Uncle Dashboard](https://github.com/rorro/uncle-dashboard) - A dashboard to change settings, schedule messages and more.
