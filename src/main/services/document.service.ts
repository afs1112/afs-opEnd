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
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    type?: string;
  }> {
    try {
      const ext = extname(filePath).toLowerCase();

      if (ext === ".doc" || ext === ".docx") {
        return await this.readWordDocument(filePath);
      } else if (ext === ".xls" || ext === ".xlsx") {
        return await this.readExcelDocument(filePath);
      } else if (ext === ".txt") {
        return await this.readTextDocument(filePath);
      } else if (ext === ".pdf") {
        return {
          success: false,
          error:
            "PDF文件解析需要额外的库支持，当前仅支持 Word、Excel 和文本文件",
        };
      } else {
        return {
          success: false,
          error: "不支持的文件格式，支持的格式：.doc、.docx、.xls、.xlsx、.txt",
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
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    type?: string;
  }> {
    try {
      // 使用 mammoth 库解析 Word 文档
      const mammoth = await import("mammoth");

      // 配置转换选项以保留更多样式
      const options = {
        convertImage: mammoth.images.imgElement(function (image: any) {
          return image.read("base64").then(function (imageBuffer: any) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer,
            };
          });
        }),
        styleMap: [
          // 保留段落样式
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",
          // 保留字符样式
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
          // 保留表格样式
          "table => table.word-table",
          "tr => tr",
          "td => td",
          // 保留列表样式
          "p[style-name='List Paragraph'] => li:fresh",
        ],
        includeDefaultStyleMap: true,
        includeEmbeddedStyleMap: true,
      };

      // 提取HTML内容（保留格式）
      const htmlResult = await mammoth.convertToHtml(
        {
          path: filePath,
        },
        options
      );

      // 同时提取纯文本作为备选
      const textResult = await mammoth.extractRawText({ path: filePath });

      if (htmlResult.value || textResult.value) {
        // 优先使用HTML格式，如果失败则使用纯文本
        let content = htmlResult.value || textResult.value;

        // 如果有HTML内容，添加CSS样式来改善显示效果
        if (htmlResult.value && content) {
          content = this.enhanceWordDocumentHtml(content);
        }

        return {
          success: true,
          data: content,
          type: "word",
        };
      } else {
        return {
          success: false,
          error: "文档内容为空或无法解析",
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

  /**
   * 读取Excel文档
   * @param filePath 文件路径
   * @returns 文档内容
   */
  private static async readExcelDocument(
    filePath: string
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    type?: string;
  }> {
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.readFile(filePath);

      let content = "";

      // 遍历所有工作表
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];

        if (index > 0) {
          content += "\n\n" + "=".repeat(50) + "\n";
        }

        content += `工作表: ${sheetName}\n`;
        content += "-".repeat(30) + "\n";

        // 转换为文本格式
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        content += sheetText;
      });

      return {
        success: true,
        data: content,
        type: "excel",
      };
    } catch (error) {
      console.error("解析Excel文档失败:", error);
      return {
        success: false,
        error: "Excel文档解析失败: " + (error as Error).message,
      };
    }
  }

  /**
   * 读取文本文档
   * @param filePath 文件路径
   * @returns 文档内容
   */
  private static async readTextDocument(
    filePath: string
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    type?: string;
  }> {
    try {
      const content = readFileSync(filePath, "utf-8");
      return {
        success: true,
        data: content,
        type: "text",
      };
    } catch (error) {
      console.error("读取文本文档失败:", error);
      return {
        success: false,
        error: "文本文档读取失败: " + (error as Error).message,
      };
    }
  }

  /**
   * 将HTML内容转换为格式化的文本
   * @param html HTML内容
   * @returns 格式化的文本
   */
  private static convertHtmlToText(html: string): string {
    return html
      .replace(/<p>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<h[1-6][^>]*>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<\/li>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /**
   * 增强Word文档HTML内容的显示效果
   * @param html 原始HTML内容
   * @returns 增强后的HTML内容
   */
  private static enhanceWordDocumentHtml(html: string): string {
    // 添加CSS样式来改善Word文档的显示效果
    const cssStyles = `
<style>
  .word-document {
    font-family: 'Times New Roman', '宋体', serif;
    line-height: 1.6;
    color: #333;
    max-width: 100%;
    margin: 0;
    padding: 20px;
    background: #fff;
  }
  .word-document h1, .word-document h2, .word-document h3, 
  .word-document h4, .word-document h5, .word-document h6 {
    color: #2c3e50;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: bold;
  }
  .word-document h1 { font-size: 1.8em; border-bottom: 2px solid #3498db; padding-bottom: 0.3em; }
  .word-document h2 { font-size: 1.5em; border-bottom: 1px solid #bdc3c7; padding-bottom: 0.2em; }
  .word-document h3 { font-size: 1.3em; }
  .word-document h4 { font-size: 1.1em; }
  .word-document p {
    margin: 0.8em 0;
    text-align: justify;
    text-indent: 2em;
  }
  .word-document strong, .word-document b {
    font-weight: bold;
    color: #2c3e50;
  }
  .word-document em, .word-document i {
    font-style: italic;
    color: #7f8c8d;
  }
  .word-document ul, .word-document ol {
    margin: 1em 0;
    padding-left: 2em;
  }
  .word-document li {
    margin: 0.3em 0;
    line-height: 1.5;
  }
  .word-document table.word-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 0.9em;
  }
  .word-document table.word-table th,
  .word-document table.word-table td {
    border: 1px solid #bdc3c7;
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }
  .word-document table.word-table th {
    background-color: #ecf0f1;
    font-weight: bold;
    color: #2c3e50;
  }
  .word-document table.word-table tr:nth-child(even) {
    background-color: #f8f9fa;
  }
  .word-document img {
    max-width: 100%;
    height: auto;
    margin: 1em 0;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .word-document blockquote {
    border-left: 4px solid #3498db;
    padding-left: 1em;
    margin: 1em 0;
    font-style: italic;
    background-color: #f8f9fa;
    padding: 1em;
    border-radius: 0 4px 4px 0;
  }
  .word-document code {
    background-color: #f1f2f6;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
  }
  .word-document pre {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 1em;
    overflow-x: auto;
    margin: 1em 0;
  }
  .word-document a {
    color: #3498db;
    text-decoration: none;
  }
  .word-document a:hover {
    text-decoration: underline;
  }
  /* 添加打印样式 */
  @media print {
    .word-document {
      font-size: 12pt;
      line-height: 1.5;
    }
  }
</style>
`;

    // 将HTML内容包装在带样式的div中
    const wrappedHtml = `
${cssStyles}
<div class="word-document">
${html}
</div>
`;

    return wrappedHtml;
  }
}
