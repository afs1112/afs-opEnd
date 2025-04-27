import { ElMessage } from "element-plus";

class CommonService {
  exportJson = async (data, title = "users") => {
    try {
      const exportData = {
        [title]: JSON.parse(JSON.stringify(data)),
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };
      const filePath = await window.electronAPI.showSaveDialog({
        title: `Export ${title} data`,
        defaultFileName: `${title}_export_${new Date()
          .toISOString()
          .slice(0, 10)}.json`,
        filters: [{ name: "JSON Files", extensions: ["json"] }],
      });

      if (!filePath) return;

      const result = await window.electronAPI.exportToFile(
        filePath,
        exportData
      );

      if (result.success) {
        ElMessage.success({
          message: `Successfully exported to ${result.path}`,
          duration: 5000,
          showClose: true,
        });
      } else {
        ElMessage.error(`Export failed: ${result.error}`);
      }
    } catch (error) {
      ElMessage.error(`Export error: ${error.message}`);
    }
  };
}

export const commonService = new CommonService();
