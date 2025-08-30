import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { Octokit } from '@octokit/rest';
import { labelResponse } from '..';

const commitLabelMap: Record<string, string> = {
  fix: "type: bug",
  docs: "type: documentation",
  feat: "type: enhancement",
  perf: "type: performance",
  question: "type: question",
  refactor: "type: refactor",
  test: "type: tests",
  chore: "type: chores",
  ci: "type: tests",
};

const areaLabelMap: Record<string, string[]> = {
  "area: i18n": ["locales", "fr.json", "en.json"],
  "area: ui": ["ui", "components"],
  "area: cache": ["database", "DatabaseProvider.tsx", "schema"],
  "area: backend": ["services", "stores"],
};

const issueLabelMap: Record<string, string[]> = {
  "type: bug": ["bug", "crash", "problèmes"],
  "type: enhancement": ["feature", "ajouter"],
};

export default async function autoLabel(
  context: Context,
  octokit: Octokit
): Promise<labelResponse> {
  const { owner, repo } = context.repo;
  const pull = context.payload.pull_request;
  const issue = context.payload.issue;
  const labels = new Set<string>(["status: needs triage"]);
  const errors: string[] = [];

  const issue_number = pull?.number ?? issue?.number;
  if (!issue_number) return { errors, labels: [...labels] };

  if (pull) {
    const [commitsResp, filesResp] = await Promise.all([
      octokit.rest.pulls.listCommits({ owner, repo, pull_number: pull.number }),
      octokit.rest.pulls.listFiles({ owner, repo, pull_number: pull.number }),
    ]);

    for (const [label, patterns] of Object.entries(areaLabelMap)) {
      if (patterns.some(pattern => filesResp.data.some(f => f.filename.includes(pattern)))) {
        labels.add(label);
      }
    }

    for (const commit of commitsResp.data) {
      const match = commit.commit.message.match(/^(\w+)(\(.+\))?:/);
      const prefix = match?.[1].toLowerCase();

      if (prefix && commitLabelMap[prefix]) {
        const label = commitLabelMap[prefix];
        if (label) labels.add(label);
      } else {
        labels.add("status: invalid");
        errors.push(
          "Afin d'améliorer nos processus d'automatisation et de garantir une meilleure lisibilité de l'historique Git, nous demandons à tous nos contributeurs de suivre la convention [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)."
        );
      }
    }
  }

  if (issue) {
    const { data: fullIssue } = await octokit.rest.issues.get({ owner, repo, issue_number });
    const content = `${fullIssue.title ?? ""} ${fullIssue.body ?? ""}`.toLowerCase();

    for (const [label, keywords] of Object.entries(issueLabelMap)) {
      if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
        labels.add(label);
      }
    }
  }

  if (labels.has("status: invalid")) {
    for (const label of [...labels]) {
      if (!["status: needs triage", "status: invalid"].includes(label)) labels.delete(label);
    }
  }

  await octokit.rest.issues.setLabels({
    owner,
    repo,
    issue_number,
    labels: [...labels],
  });

  return { errors, labels: [...labels] };
}

export async function editInvalidLabel(
  context: Context,
  octokit: Octokit,
  type: "add" | "remove"
): Promise<boolean> {
  const { owner, repo } = context.repo;
  const pull = context.payload.pull_request;
  const issue = context.payload.issue;
  const issueNumber = pull?.number ?? issue?.number;

  if (!issueNumber) return false;

  const addInvalid = async () => {
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels: ["status: invalid"],
    });

    if (pull) {
      try {
        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: issueNumber,
          name: "status: needs review",
        });
      } catch (err: any) {
        if (err.status !== 404) throw err;
      }
    }
  };

  const removeInvalid = async () => {
    try {
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: "status: invalid",
      });
    } catch (err: any) {
      if (err.status !== 404) throw err;
    }

    if (pull) {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels: ["status: needs review"],
      });
    }
  };

  if (type === "add") await addInvalid();
  if (type === "remove") await removeInvalid();

  return true;
}
