/**
 * 文档状态管理服务
 * 管理已打开文档的状态，支持隐藏/显示而不是真正关闭
 */
export interface DocumentState {
  filePath: string;
  fileName: string;
  content: string;
  type: string;
  isVisible: boolean;
  lastOpenTime: number;
}

export class DocumentStateService {
  private static openedDocuments: Map<string, DocumentState> = new Map();
  private static currentDocumentPath: string | null = null;

  /**
   * 保存文档状态
   * @param filePath 文件路径
   * @param fileName 文件名
   * @param content 文档内容
   * @param type 文档类型
   */
  static saveDocumentState(
    filePath: string,
    fileName: string,
    content: string,
    type: string
  ): void {
    const documentState: DocumentState = {
      filePath,
      fileName,
      content,
      type,
      isVisible: true,
      lastOpenTime: Date.now(),
    };

    this.openedDocuments.set(filePath, documentState);
    this.currentDocumentPath = filePath;

    console.log(`[DocumentState] 保存文档状态: ${fileName}`);
  }

  /**
   * 获取当前文档状态
   * @returns 当前文档状态或null
   */
  static getCurrentDocumentState(): DocumentState | null {
    if (!this.currentDocumentPath) {
      return null;
    }
    return this.openedDocuments.get(this.currentDocumentPath) || null;
  }

  /**
   * 隐藏当前文档
   */
  static hideCurrentDocument(): void {
    if (this.currentDocumentPath) {
      const state = this.openedDocuments.get(this.currentDocumentPath);
      if (state) {
        state.isVisible = false;
        console.log(`[DocumentState] 隐藏文档: ${state.fileName}`);
      }
    }
  }

  /**
   * 显示最近的文档
   * @returns 文档状态或null
   */
  static showRecentDocument(): DocumentState | null {
    // 查找最近打开的文档
    let recentDocument: DocumentState | null = null;
    let latestTime = 0;

    for (const [path, state] of this.openedDocuments) {
      if (state.lastOpenTime > latestTime) {
        latestTime = state.lastOpenTime;
        recentDocument = state;
      }
    }

    if (recentDocument) {
      recentDocument.isVisible = true;
      recentDocument.lastOpenTime = Date.now();
      this.currentDocumentPath = recentDocument.filePath;
      console.log(`[DocumentState] 显示最近文档: ${recentDocument.fileName}`);
    }

    return recentDocument;
  }

  /**
   * 获取所有已打开的文档列表
   * @returns 文档列表
   */
  static getAllDocuments(): DocumentState[] {
    return Array.from(this.openedDocuments.values()).sort(
      (a, b) => b.lastOpenTime - a.lastOpenTime
    );
  }

  /**
   * 清除文档状态
   * @param filePath 文件路径（可选，不传则清除所有）
   */
  static clearDocumentState(filePath?: string): void {
    if (filePath) {
      this.openedDocuments.delete(filePath);
      if (this.currentDocumentPath === filePath) {
        this.currentDocumentPath = null;
      }
      console.log(`[DocumentState] 清除文档状态: ${filePath}`);
    } else {
      this.openedDocuments.clear();
      this.currentDocumentPath = null;
      console.log("[DocumentState] 清除所有文档状态");
    }
  }

  /**
   * 检查是否有已打开的文档
   * @returns 是否有文档
   */
  static hasOpenedDocuments(): boolean {
    return this.openedDocuments.size > 0;
  }

  /**
   * 获取文档统计信息
   * @returns 统计信息
   */
  static getDocumentStats(): {
    total: number;
    visible: number;
    hidden: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.openedDocuments.size,
      visible: 0,
      hidden: 0,
      byType: {} as Record<string, number>,
    };

    for (const state of this.openedDocuments.values()) {
      if (state.isVisible) {
        stats.visible++;
      } else {
        stats.hidden++;
      }

      stats.byType[state.type] = (stats.byType[state.type] || 0) + 1;
    }

    return stats;
  }
}
