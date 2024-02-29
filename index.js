const core = require("@actions/core");
const Client = require("ssh2-sftp-client");
const path = require("path");
const fs = require("fs").promises;

// const host = core.getInput("host");
// const port = core.getInput("port");
// const username = core.getInput("username");
// const password = core.getInput("password");
// const sourceDir = core.getInput("sourceDir");
// const targetDir = core.getInput("targetDir");
// const privateKey = core.getInput("privateKey");
// const passphrase = core.getInput("passphrase");

const host = "51.178.40.103";
const port = 3100;
const username = "octe_app";
const password = "Password1230!";
const sourceDir = ".next\nnext.config.js";
const targetDir = "OCTELift/";

core.info(`connecting to ${username}@${host}:${port}`);

class SFTPClient {
  constructor() {
    this.client = new Client();
  }

  async connect(options) {
    core.info(`Connecting to ${options.host}:${options.port}`);
    try {
      await this.client.connect(options);
    } catch (err) {
      core.info("Failed to connect:", err);
    }
  }

  async disconnect() {
    await this.client.end();
  }

  async uploadFilesAndDirectories(localPath, remotePath) {
    const stats = await fs.lstat(localPath);

    if (stats.isDirectory()) {
      const items = await fs.readdir(localPath);
      for (const item of items) {
        await this.uploadFilesAndDirectories(
          path.join(localPath, item),
          path.join(remotePath, item)
        );
      }
    } else {
      remotePath = remotePath.replaceAll("\\", "/");
      const remoteDir = path.dirname(remotePath);
      try {
        await this.client.mkdir(remoteDir, true);
      } catch (mkdirError) {
        if (mkdirError.code !== 4) {
          throw mkdirError;
        }
      }
      const fileContents = await fs.readFile(localPath);
      await this.client.put(Buffer.from(fileContents), remotePath);
      console.log(`Uploaded file: ${localPath}`);
    }
  }
}

(async () => {
  //* Open the connection
  const client = new SFTPClient();
  await client.connect({ host, port, username, password });

  //* Upload local files to remote file
  const filesArray = sourceDir.split("\n");
  for (const item of filesArray) {
    const localPath = path.resolve(__dirname, item);
    const remotePath = `${targetDir}/${item}`;

    await client.uploadFilesAndDirectories(localPath, remotePath);
  }
  //* Close the connection
  await client.disconnect();
})();
