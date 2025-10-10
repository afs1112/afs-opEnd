/**
 * 渲染进程文档服务
 * 提供文档操作的统一接口，支持状态管理和缓存
 */
export interface DocumentInfo {
  filePath: string;
  fileName: string;
  content: string;
  type: string;
  isFromCache: boolean;
  isHtml?: boolean; // 新增：标识内容是否为HTML格式
}

export class DocumentService {
  /**
   * 选择并打开文档
   * @returns 文档信息或null
   */
  static async selectAndOpenDocument(): Promise<DocumentInfo | null> {
    try {
      // 检查是否有最近打开的文档
      const hasOpened = await this.hasOpenedDocuments();

      if (hasOpened) {
        // 如果有最近文档，直接显示
        const recentDoc = await this.showRecentDocument();
        if (recentDoc) {
          return recentDoc;
        }
      }

      // 没有最近文档，打开文件选择器
      return await this.forceSelectNewDocument();
    } catch (error) {
      console.error("选择文档失败:", error);
      throw error;
    }
  }

  /**
   * 强制选择新文档（忽略缓存）
   * @returns 文档信息或null
   */
  static async forceSelectNewDocument(): Promise<DocumentInfo | null> {
    try {
      const result = await (window as any).electronAPI.dialog.showOpenDialog({
        title: "选择文档",
        filters: [
          {
            name: "文档文件",
            extensions: ["doc", "docx", "xls", "xlsx", "txt"],
          },
          { name: "Word 文档", extensions: ["doc", "docx"] },
          { name: "Excel 文档", extensions: ["xls", "xlsx"] },
          { name: "文本文件", extensions: ["txt"] },
          { name: "所有文件", extensions: ["*"] },
        ],
        properties: ["openFile"],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        return await this.loadDocument(filePath);
      }

      return null;
    } catch (error) {
      console.error("强制选择新文档失败:", error);
      throw error;
    }
  }

  /**
   * 加载指定路径的文档
   * @param filePath 文件路径
   * @returns 文档信息
   */
  static async loadDocument(filePath: string): Promise<DocumentInfo | null> {
    try {
      const content = await (window as any).electronAPI.document.readDocument(
        filePath
      );

      if (content.success) {
        const fileName = filePath.split(/[\\\/]/).pop() || "未知文档";

        return {
          filePath,
          fileName,
          content: content.data,
          type: content.type || "unknown",
          isFromCache: false,
        };
      } else {
        throw new Error(content.error || "文档加载失败");
      }
    } catch (error) {
      console.error("加载文档失败:", error);
      throw error;
    }
  }

  /**
   * 显示最近打开的文档
   * @returns 文档信息或null
   */
  static async showRecentDocument(): Promise<DocumentInfo | null> {
    try {
      const result = await (
        window as any
      ).electronAPI.document.getRecentDocument();

      if (result.success) {
        return {
          filePath: result.filePath,
          fileName: result.fileName,
          content: result.data,
          type: result.type,
          isFromCache: true,
        };
      }

      return null;
    } catch (error) {
      console.error("获取最近文档失败:", error);
      return null;
    }
  }

  /**
   * 隐藏当前文档
   */
  static async hideCurrentDocument(): Promise<void> {
    try {
      await (window as any).electronAPI.document.hideDocument();
    } catch (error) {
      console.error("隐藏文档失败:", error);
      throw error;
    }
  }

  /**
   * 检查是否有已打开的文档
   * @returns 是否有文档
   */
  static async hasOpenedDocuments(): Promise<boolean> {
    try {
      const result = await (
        window as any
      ).electronAPI.document.hasOpenedDocuments();
      return result.success ? result.data : false;
    } catch (error) {
      console.error("检查文档状态失败:", error);
      return false;
    }
  }

  /**
   * 获取文档统计信息
   * @returns 统计信息
   */
  static async getDocumentStats(): Promise<any> {
    try {
      const result = await (window as any).electronAPI.document.getStats();
      return result.success ? result.data : null;
    } catch (error) {
      console.error("获取文档统计失败:", error);
      return null;
    }
  }

  /**
   * 格式化文档内容以便显示
   * @param content 原始内容
   * @param type 文档类型
   * @returns 格式化后的内容
   */
  static formatDocumentContent(
    content: string,
    type: string
  ): { content: string; isHtml: boolean } {
    if (!content) return { content: "", isHtml: false };

    switch (type) {
      case "word":
        // Word文档内容可能是HTML格式，需要特殊处理
        if (content.includes('<div class="word-document">')) {
          // 如果包含样式化的HTML，直接返回HTML内容
          return { content, isHtml: true };
        } else {
          // 如果是纯文本，按文本处理
          return { content, isHtml: false };
        }

      case "excel":
        // Excel内容保持原样，已经有工作表分隔
        return { content, isHtml: false };

      case "text":
        // 文本文件保持原样
        return { content, isHtml: false };

      default:
        return { content, isHtml: false };
    }
  }

  /**
   * 获取文档类型的显示名称
   * @param type 文档类型
   * @returns 显示名称
   */
  static getDocumentTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      word: "Word 文档",
      excel: "Excel 文档",
      text: "文本文件",
      unknown: "未知文档",
    };

    return typeMap[type] || type;
  }

  /**
   * 获取文档图标
   * @param type 文档类型
   * @returns 图标类名
   */
  static getDocumentIcon(type: string): string {
    const iconMap: Record<string, string> = {
      word: "📄",
      excel: "📊",
      text: "📝",
      unknown: "📋",
    };

    return iconMap[type] || "📋";
  }
}
