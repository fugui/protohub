/**
 * 差异生成工具
 */

/**
 * 差异类型
 */
export enum DiffType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
}

/**
 * 差异块
 */
export interface DiffBlock {
  type: DiffType;
  oldContent?: string;
  newContent?: string;
  lineStart?: number;
  lineEnd?: number;
}

/**
 * 行差异
 */
export interface LineDiff {
  type: DiffType;
  content: string;
  lineNumber?: number;
}

/**
 * 生成统一差异格式
 */
export function generateUnifiedDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  let diff = '';
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      // 相同行
      diff += ` ${oldLines[i]}\n`;
      i++;
      j++;
    } else if (i < oldLines.length && (j >= newLines.length || oldLines[i] < newLines[j])) {
      // 删除行
      diff += `-${oldLines[i]}\n`;
      i++;
    } else {
      // 新增行
      diff += `+${newLines[j]}\n`;
      j++;
    }
  }

  return diff;
}

/**
 * 生成行差异数组
 */
export function generateLineDiffs(oldContent: string, newContent: string): LineDiff[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const diffs: LineDiff[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      // 相同行
      diffs.push({
        type: DiffType.MODIFIED,
        content: oldLines[i],
      });
      i++;
      j++;
    } else if (i < oldLines.length && (j >= newLines.length || oldLines[i] < newLines[j])) {
      // 删除行
      diffs.push({
        type: DiffType.REMOVED,
        content: oldLines[i],
        lineNumber: i + 1,
      });
      i++;
    } else {
      // 新增行
      diffs.push({
        type: DiffType.ADDED,
        content: newLines[j],
        lineNumber: j + 1,
      });
      j++;
    }
  }

  return diffs;
}

/**
 * 格式化差异为 HTML
 */
export function formatDiffToHTML(unifiedDiff: string): string {
  const lines = unifiedDiff.split('\n');
  let html = '<div class="diff-container">';

  for (const line of lines) {
    if (line.startsWith('+')) {
      html += `<div class="diff-added">${escapeHtml(line)}</div>`;
    } else if (line.startsWith('-')) {
      html += `<div class="diff-removed">${escapeHtml(line)}</div>`;
    } else {
      html += `<div class="diff-unchanged">${escapeHtml(line)}</div>`;
    }
  }

  html += '</div>';
  return html;
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 比较两个文件并返回差异
 */
export interface FileComparison {
  file1: string;
  file2: string;
  unifiedDiff: string;
  lineDiffs: LineDiff[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

export function compareFiles(file1Content: string, file2Content: string): FileComparison {
  const unifiedDiff = generateUnifiedDiff(file1Content, file2Content);
  const lineDiffs = generateLineDiffs(file1Content, file2Content);

  // 统计差异
  const stats = {
    additions: 0,
    deletions: 0,
    modifications: 0,
  };

  for (const diff of lineDiffs) {
    if (diff.type === DiffType.ADDED) {
      stats.additions++;
    } else if (diff.type === DiffType.REMOVED) {
      stats.deletions++;
    }
  }

  return {
    file1: 'File 1',
    file2: 'File 2',
    unifiedDiff,
    lineDiffs,
    stats,
  };
}
