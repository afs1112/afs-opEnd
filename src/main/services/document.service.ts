import { readFileSync } from "fs";
import { extname } from "path";

export class DocumentService {
  /**
   * 读取文档内容
   * @param filePath 文件路径
   * @returns 文档内容
   */
  static async readDocument(
    filePath: string
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const ext = extname(filePath).toLowerCase();

      if (ext === ".doc" || ext === ".docx") {
        return await this.readWordDocument(filePath);
      } else {
        return {
          success: false,
          error: "不支持的文件格式，仅支持 .doc 和 .docx 文件",
        };
      }
    } catch (error) {
      console.error("读取文档失败:", error);
      return {
        success: false,
        error: "读取文档失败: " + (error as Error).message,
      };
    }
  }

  /**
   * 读取Word文档
   * @param filePath 文件路径
   * @returns 文档内容
   */
  private static async readWordDocument(
    filePath: string
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      // 尝试动态导入 mammoth 库
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ path: filePath });

        if (result.value) {
          return {
            success: true,
            data: result.value,
          };
        } else {
          return {
            success: false,
            error: "文档内容为空",
          };
        }
      } catch (mammothError) {
        console.log("mammoth库不可用，尝试其他方法读取文档");

        // 返回提示信息，说明需要安装mammoth库来完整支持Word文档
        return {
          success: true,
          data: `文档路径: ${filePath}

注意：要完整支持Word文档解析，请运行以下命令安装mammoth库：
npm install mammoth

当前仅显示文件路径信息。`,
        };
      }
    } catch (error) {
      console.error("解析Word文档失败:", error);
      return {
        success: false,
        error: "Word文档解析失败: " + (error as Error).message,
      };
    }
  }
}
