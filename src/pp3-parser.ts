/**
 * PP3 file format parser with search/replace block handling
 */

export interface SearchReplaceBlock {
  search: string;
  replace: string;
}

export function parseSearchReplaceBlocks(text: string): SearchReplaceBlock[] {
  const blocks: SearchReplaceBlock[] = [];
  let currentBlock: { search: string[]; replace: string[] } = {
    search: [],
    replace: [],
  };

  let isInSearch = false;
  let isInReplace = false;

  for (const line of text.split("\n")) {
    if (line.startsWith("<<<<<<< SEARCH")) {
      isInSearch = true;
      isInReplace = false;
      currentBlock = { search: [], replace: [] };
    } else if (line.startsWith("=======")) {
      isInSearch = false;
      isInReplace = true;
    } else if (line.startsWith(">>>>>>> REPLACE")) {
      isInSearch = false;
      isInReplace = false;
      blocks.push({
        search: currentBlock.search.join("\n"),
        replace: currentBlock.replace.join("\n"),
      });
    } else {
      if (isInSearch) currentBlock.search.push(line);
      if (isInReplace) currentBlock.replace.push(line);
    }
  }

  return blocks;
}
