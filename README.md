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

This project does some very clan specific things that you will need to heavily modify or comform to, to be able to use the code as is. For this we use the Google Workspace APIs, so you will need to setup access credentials. Find the link in the instructions for running the project. You will also need to configure some variables in `src/config.ts` so it matches your own server if you are going to host this bot for your own clan.

<br />

#### Running the project

1. Create a .env file in the root folder of the project folder and add the following to it.

```
DISCORD_TOKEN={discord_bot_token}
DEV_GUILD={guild_id}
DEV_NEW_MEMBERS_CHANNEL={channel_id}
DEV_APP_MANAGER={role_id}
DEV_MEMBER={role_id}
DEV_PROTECTOR={role_id}
DEV_BULWARK={role_id}
DEV=true
```

2. For some commands to work, you will need to create access credentials for Google Workspace APIs. Follow [this link](https://developers.google.com/workspace/guides/create-credentials) and create a service account. After creating a servie account, download the credentials as a JSON file, rename the file to `unclebot-credentials.json` and add it to the root folder of the project.

3. Run the project using `npm run start` or `npm run dev`

<br />
