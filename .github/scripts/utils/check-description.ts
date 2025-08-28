import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { Octokit } from '@octokit/rest';
import { descriptionSize } from '..';

const MIN_DESCRIPTION = 10;

export default async function checkDescription(
  context: Context,
  octokit: Octokit
): Promise<descriptionSize> {
  const pull = context.payload.pull_request;
  const issue = context.payload.issue;
  const errors: string[] = [];

  const content = pull?.body ?? issue?.body ?? "";

  if (content.length < MIN_DESCRIPTION) {
    errors.push(
      "La description fournie est trop brève et ne nous permet pas de bien comprendre l'objectif ou l'impact de ta proposition, merci de la modifier en y ajoutant des détails."
    );
  }

  if (pull && !content.includes("https://github.com/user-attachments/assets")) {
    errors.push(
      "Merci d’ajouter une capture d’écran dans la description de la Pull Request afin de mieux illustrer les changements apportés."
    );
  }

  return { errors };
}
