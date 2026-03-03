//update_local_branches.ts

import * as vscode from "vscode";
import { COMMAND_GIT } from "../const/comands";
import { ObjectWithAnyValues } from "../type/ObjectWithAnyValues";
import {
  logError,
  logInfo,
  logStatus,
  logWarning,
} from "../utils/outputChannel";
import { SetPathCommands } from "../utils/Path";
import {
  DownloaderRemoteBranches,
  getCurrentBranch,
  getListBranches,
  isGitClean,
  isGitEnvironment,
  runCommand,
} from "../utils/utils";

const LOCAL = "LOCAL";
const REMOTE = "REMOTE";

const branchOutDateTobranchBase = async function (
  branch: string,
  branchBase: string,
): Promise<boolean> {
  const listBranch = (
    await runCommand(COMMAND_GIT.LOG_BRANCH + " -n 100 " + branchBase)
  )
    .replace("HEAD ->", "")
    .split("\n");
  return (
    listBranch.findIndex(
      (x) => x.split(",").findIndex((y) => y.trim() === branch) !== -1,
    ) !== -1
  );
};

const UpdateCurrentBranch = async function (branch: string, brachBase: string) {
  logInfo("Updating current branch");
  const isClean = await isGitClean();
  if (!isClean) {
    logWarning(
      `Changes detected in branch "${branch}". Perform a clean first.`,
      true,
    );
    return;
  }
  await runCommand(
    COMMAND_GIT.BRACH_CURRENT_UPDATE_FORCE.replace(
      /\$\{branch\_base\}/,
      brachBase,
    ),
  );
  logInfo(`Current branch "${branch}" updated successfully`);
};
const updateOutdatedBranches = async function (
  branch: string,
  branchBase: string,
) {
  logInfo(`Updating outdated branch "${branch}" to "${branchBase}"`);

  await runCommand(
    COMMAND_GIT.BRACH_UPDATE_FORCE.replace(/\$\{branch\}/, branch).replace(
      /\$\{branch\_base\}/,
      branchBase,
    ),
  );

  logInfo(`Outdated branch "${branch}" updated successfully`);
};

const traverseBranches = async function (listBranch: ObjectWithAnyValues) {
  const currentBranch = await getCurrentBranch();
  for (const [branch, element] of Object.entries(listBranch)) {
    if (!element[LOCAL]) {
      logInfo(`Local branch "${branch}" not found`);
      continue;
    }
    if (!element[REMOTE]) {
      logInfo(`Remote branch "${branch}" not found`);
      continue;
    }
    if (element[LOCAL] === element[REMOTE]) {
      logInfo(`Branch "${branch}" is already up to date`);
      continue;
    }

    const branchRemote = `origin/${branch}`;
    const isBranchOutDate = await branchOutDateTobranchBase(
      branch,
      branchRemote,
    );
    if (!isBranchOutDate) {
      const isBranchBaseOutDate = await branchOutDateTobranchBase(
        branchRemote,
        branch,
      );
      if (isBranchBaseOutDate) {
        logWarning(
          `Remote branch "${branchRemote}" has changes that need to be pushed`,
          true,
        );
      } else {
        logWarning(`Manual review needed for branch "${branch}"`, true);
      }
      continue;
    }

    logStatus(`Updating branch "${branch}"`);
    if (branch === currentBranch) {
      await UpdateCurrentBranch(branch, branchRemote);
    } else {
      await updateOutdatedBranches(branch, branchRemote);
    }
  }
};

export async function UpdateLocalBranches() {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders && workspaceFolders.length > 0) {
    const projectPath = workspaceFolders[0].uri.fsPath;
    SetPathCommands(projectPath);
    try {
      const isEnvironmentGit = await isGitEnvironment();
      if (!isEnvironmentGit) {
        logError("Not a Git repository", true);
        return;
      }
      await DownloaderRemoteBranches();
      let listBranch = await getListBranches();
      const objBranches = listBranch.reduce((prev: any, value) => {
        if (value === "") {
          return prev;
        }
        const [commit, branchFullName] = value.split(" ");

        const branchArray =
          branchFullName.match(/^(refs\/heads\/)(.*)/) ??
          (branchFullName.match(
            /^(refs\/remotes\/origin\/)(.*)/,
          ) as RegExpMatchArray);

        if (!branchArray) {
          logWarning(
            `Branch name "${branchFullName}" does not match expected patterns`,
            true,
          );
          return prev;
        }

        let branchName = branchArray[2];
        let branchObj = prev[branchName] ?? {};
        if (branchArray[1] === "refs/heads/") {
          branchObj[LOCAL] = commit;
        } else {
          branchObj[REMOTE] = commit;
        }

        prev[branchName] = branchObj;

        return prev;
      }, {});
      await traverseBranches(objBranches);

      logInfo("Branch processed successfully", true);
    } catch (error) {
      logError(`${error}`, true);
    }
  } else {
    logError("No workspace folder open", true);
  }
}
