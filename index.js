const core = require("@actions/core");
const Client = require("ssh2-sftp-client");

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
    try {
      const files = JSON.parse(localFiles);
      for (const file of files) {
        core.info(`Uploading ${file} ...`);
        await this.client.put(file, file);
      }
    } catch (err) {
      console.error("Uploading failed:", err);
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
