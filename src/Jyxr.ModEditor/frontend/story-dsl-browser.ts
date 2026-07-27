import {
  compileScript,
  decompileStoryJson,
  parseStory as parseCoreStory,
} from "../../../packages/story-dsl-core/src";

let zeroArgumentPredicates = new Set<string>();

function configureRuntimeContract(contract: RuntimeContract | null | undefined): void {
  zeroArgumentPredicates = new Set(
    (contract?.predicates ?? [])
      .filter((predicate) => predicate.minimumArguments === 0)
      .flatMap((predicate) => [predicate.name, ...(predicate.aliases ?? [])]),
  );
}

function parseStory(text: string) {
  return parseCoreStory(text, { zeroArgumentPredicates });
}

function analyzeStory(text: string) {
  const parseResult = parseStory(text);
  const compileResult = compileScript(parseResult.ast);
  const diagnostics = [...parseResult.diagnostics, ...compileResult.diagnostics];
  const hasErrors = diagnostics.some((item) => item.severity === "error");
  return {
    ast: parseResult.ast,
    diagnostics,
    ir: hasErrors ? null : compileResult.ir,
    jsonText: hasErrors ? null : `${JSON.stringify(compileResult.ir, null, 2)}\n`,
  };
}

interface RuntimeContract {
  predicates?: Array<{
    name: string;
    aliases?: string[];
    minimumArguments: number;
  }>;
}

const storyDsl = {
  analyzeStory,
  parseStory,
  compileScript,
  decompileStoryJson,
  configureRuntimeContract,
};

declare global {
  interface Window {
    StoryDsl: typeof storyDsl;
  }
}

window.StoryDsl = storyDsl;
