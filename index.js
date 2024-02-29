const core = require("@actions/core");
const Client = require("ssh2-sftp-client");
const fs = require("fs").promises;

const host = core.getInput("host");
const port = core.getInput("port");
const username = core.getInput("username");
const password = core.getInput("password");
const sourceDir = core.getInput("sourceDir");
const targetDir = core.getInput("targetDir");
const privateKey = core.getInput("privateKey");
const passphrase = core.getInput("passphrase");

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

  async uploadFile(localFile, remoteFile) {
    core.info(`Uploading ${localFile} to ${remoteFile} ...`);
    try {
      await this.client.put(localFile, remoteFile);
    } catch (err) {
      console.error("Uploading failed:", err);
    }
  }

  async uploadFilesList(localFiles) {
    core.info(`Uploading ${localFiles}`);
    const files = localFiles.split("\n");
    for (const file of files) {
      core.info(`Uploading ${file} ...`);
      fs.stat(path, async (err, stats) => {
        if (err) {
          throw err;
        }

        if (stats.isFile()) {
          await this.client.put(file, targetDir + file);
        }

        if (stats.isDirectory()) {
          await this.client.uploadDir(file, targetDir + file);
        }
      });
    }
  }
}

(async () => {
  //* Open the connection
  const client = new SFTPClient();
  await client.connect({ host, port, username, password });

  //* Upload local files to remote file
  await client.uploadFilesList(sourceDir);

  //* Close the connection
  await client.disconnect();
})();
