const core = require("@actions/core");
const Client = require("ssh2-sftp-client");
const path = require("path");
const fs = require("fs").promises;

const host = core.getInput("host");
const port = core.getInput("port");
const username = core.getInput("username");
const password = core.getInput("password");
const sourceDir = core.getInput("sourceDir");
const targetDir = core.getInput("targetDir");
const workingDir = core.getInput("workingDir") ?? "./";
// const privateKey = core.getInput("privateKey");
// const passphrase = core.getInput("passphrase");

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
    console.log(`Uploading ${localPath} to ${remotePath}`);
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
    const remotePath = `${targetDir}/${item}`;
    await client.uploadFilesAndDirectories(workingDir + item, remotePath);
  }
  //* Close the connection
  await client.disconnect();
})();
