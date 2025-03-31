import { describe, expect, it } from 'vitest';
import { parseSearchReplaceBlocks } from '../pp3-parser.js';

describe('PP3 Parser', () => {
  it('should parse complete search/replace block', () => {
    const input = `
<<<<<<< SEARCH
[Exposure]
Auto=false
=======
[Exposure]
Auto=true
>>>>>>> REPLACE`;
    
    const result = parseSearchReplaceBlocks(input);
    expect(result).toEqual([{
      search: '[Exposure]\nAuto=false',
      replace: '[Exposure]\nAuto=true'
    }]);
  });

  it('should handle multiple blocks', () => {
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
    expect(result[1].replace).toBe('SecondModified');
  });

  it('should handle incomplete blocks', () => {
    const input = `
<<<<<<< SEARCH
Unclosed`;
    
    const result = parseSearchReplaceBlocks(input);
    expect(result).toEqual([]);
  });

  it('should handle empty input', () => {
    const result = parseSearchReplaceBlocks('');
    expect(result).toEqual([]);
  });

  it('should handle partial block markers', () => {
    const input = `
=======
>>>>>>> REPLACE`;
    
    const result = parseSearchReplaceBlocks(input);
    expect(result).toEqual([]);
  });
});