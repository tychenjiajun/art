import { describe, expect, it, vi } from "vitest";
import {
  splitContentBySections,
  splitPP3ContentBySections,
  splitContentIntoSections,
} from "../agent.js";

describe("Agent Section Parsing", () => {
  describe("splitContentBySections", () => {
    it("should split content into sections correctly", () => {
      const content = `[Section1]
param1=value1
param2=value2

[Section2]
param3=value3
param4=value4`;

      const result = splitContentBySections(content);

      expect(result.sections).toHaveLength(2);
      expect(result.sectionOrders).toEqual(["Section1", "Section2"]);
      expect(result.sections[0]).toBe(
        "[Section1]\nparam1=value1\nparam2=value2",
      );
      expect(result.sections[1]).toBe(
        "[Section2]\nparam3=value3\nparam4=value4",
      );
    });

    it("should handle empty content", () => {
      const result = splitContentBySections("");

      expect(result.sections).toHaveLength(0);
      expect(result.sectionOrders).toHaveLength(0);
    });

    it("should handle content with no sections", () => {
      const content = "param1=value1\nparam2=value2";

      const result = splitContentBySections(content);

      expect(result.sections).toHaveLength(0);
      expect(result.sectionOrders).toHaveLength(0);
    });

    it("should call processSection callback for each section", () => {
      const content = `[Section1]
param1=value1

[Section2]
param2=value2`;

      const processSectionMock = vi.fn();

      splitContentBySections(content, processSectionMock);

      expect(processSectionMock).toHaveBeenCalledTimes(2);
      expect(processSectionMock).toHaveBeenCalledWith(
        "[Section1]\nparam1=value1",
        "Section1",
        0,
      );
      expect(processSectionMock).toHaveBeenCalledWith(
        "[Section2]\nparam2=value2",
        "Section2",
        1,
      );
    });
  });

  describe("splitPP3ContentBySections", () => {
    it("should categorize sections based on provided section names", () => {
      const content = `[Section1]
param1=value1

[Section2]
param2=value2

[Section3]
param3=value3`;

      const sectionNames = ["Section1", "Section3"];

      const result = splitPP3ContentBySections(content, sectionNames);

      expect(result.includedSections).toHaveLength(2);
      expect(result.excludedSections).toHaveLength(1);

      expect(result.includedSections[0]).toBe("[Section1]\nparam1=value1");
      expect(result.includedSections[1]).toBe("[Section3]\nparam3=value3");
      expect(result.excludedSections[0]).toBe("[Section2]\nparam2=value2");

      expect(result.sectionOrders).toEqual([
        "Section1",
        "Section2",
        "Section3",
      ]);
    });

    it("should handle empty content", () => {
      const result = splitPP3ContentBySections("", ["Section1"]);

      expect(result.includedSections).toHaveLength(0);
      expect(result.excludedSections).toHaveLength(0);
      expect(result.sectionOrders).toHaveLength(0);
    });

    it("should handle content with no matching sections", () => {
      const content = `[Section1]
param1=value1

[Section2]
param2=value2`;

      const sectionNames = ["Section3", "Section4"];

      const result = splitPP3ContentBySections(content, sectionNames);

      expect(result.includedSections).toHaveLength(0);
      expect(result.excludedSections).toHaveLength(2);
      expect(result.sectionOrders).toEqual(["Section1", "Section2"]);
    });
  });

  describe("splitContentIntoSections", () => {
    it("should split content into sections", () => {
      const content = `[Section1]
param1=value1

[Section2]
param2=value2`;

      const result = splitContentIntoSections(content);

      expect(result.sections).toHaveLength(2);
      expect(result.sectionOrders).toEqual(["Section1", "Section2"]);
    });

    it("should handle empty content", () => {
      const result = splitContentIntoSections("");

      expect(result.sections).toHaveLength(0);
      expect(result.sectionOrders).toHaveLength(0);
    });

    it("should handle content with no sections", () => {
      const content = "param1=value1\nparam2=value2";

      const result = splitContentIntoSections(content);

      expect(result.sections).toHaveLength(0);
      expect(result.sectionOrders).toHaveLength(0);
    });
  });
});
