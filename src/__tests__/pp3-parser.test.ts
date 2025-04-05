import { describe, expect, it } from "vitest";
import { parseSearchReplaceBlocks } from "../pp3-parser.js";

describe("PP3 Parser", () => {
  it("should parse complete search/replace block", () => {
    const input = `
<<<<<<< SEARCH
[Exposure]
Auto=false
=======
[Exposure]
Auto=true
>>>>>>> REPLACE`;

    const result = parseSearchReplaceBlocks(input);
    expect(result).toEqual([
      {
        search: "[Exposure]\nAuto=false",
        replace: "[Exposure]\nAuto=true",
      },
    ]);
  });

  it("should handle multiple blocks", () => {
    const input = `
<<<<<<< SEARCH
First
=======
FirstModified
>>>>>>> REPLACE

<<<<<<< SEARCH
Second
=======
SecondModified
>>>>>>> REPLACE`;

    const result = parseSearchReplaceBlocks(input);
    expect(result).toHaveLength(2);
    expect(result[0].search).toBe("First");
    expect(result[0].replace).toBe("FirstModified");
    expect(result[1].search).toBe("Second");
    expect(result[1].replace).toBe("SecondModified");
  });

  it("should handle incomplete blocks", () => {
    const input = `
<<<<<<< SEARCH
Unclosed`;

    const result = parseSearchReplaceBlocks(input);
    expect(result).toEqual([]);
  });

  it("should handle empty input", () => {
    const result = parseSearchReplaceBlocks("");
    expect(result).toEqual([]);
  });

  it("should handle partial block markers", () => {
    const input = `
=======
>>>>>>> REPLACE`;

    const result = parseSearchReplaceBlocks(input);
    expect(result).toEqual([]);
  });

  it("should handle blocks with empty search or replace", () => {
    const input = `
<<<<<<< SEARCH
=======
ReplaceOnly
>>>>>>> REPLACE

<<<<<<< SEARCH
SearchOnly
=======
>>>>>>> REPLACE`;

    const result = parseSearchReplaceBlocks(input);
    expect(result).toEqual([]);
  });

  it("should handle blocks with multiple lines", () => {
    const input = `
<<<<<<< SEARCH
[Section]
Param1=Value1
Param2=Value2
=======
[Section]
Param1=NewValue1
Param2=NewValue2
>>>>>>> REPLACE`;

    const result = parseSearchReplaceBlocks(input);
    expect(result).toHaveLength(1);
    expect(result[0].search).toBe("[Section]\nParam1=Value1\nParam2=Value2");
    expect(result[0].replace).toBe(
      "[Section]\nParam1=NewValue1\nParam2=NewValue2",
    );
  });

  it("should not duplicate blocks", () => {
    const input = `
<<<<<<< SEARCH
Test
=======
TestModified
>>>>>>> REPLACE`;

    const result = parseSearchReplaceBlocks(input);
    expect(result).toHaveLength(1);
    expect(result[0].search).toBe("Test");
    expect(result[0].replace).toBe("TestModified");
  });
});
