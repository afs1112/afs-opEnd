<template>
  <div class="flex flex-col h-full p-4">
    <div class="flex gap-x-1 justify-end">
        <el-button type="primary" @click="handleClickNewButon"> New </el-button>
        <el-dropdown trigger="click" @command="handleExport">
          <el-button class="secondary"> Export </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">To JSON</el-dropdown-item>
              <el-dropdown-item command="db">To SQLite</el-dropdown-item>
              <el-dropdown-item command="sql">To SQL</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown trigger="click" @command="handleImport">
          <el-button class="secondary"> Import </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">From JSON</el-dropdown-item>
              <el-dropdown-item command="db">From SQLite</el-dropdown-item>
              <el-dropdown-item command="sql">From SQL</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="danger" @click="handleReset">
          Reset Database
        </el-button>
      </div>
    <el-tabs
    v-model="activeTabId"
    type="card"
    class="demo-tabs"
  >
    <el-tab-pane :label="TAB_VALUES.USERS.label" :name="TAB_VALUES.USERS.id"> <el-table
      :data="users"
      height="100%"
      style="width: 100%"
      stripe
      v-loading="loading"
    >
      <el-table-column
        v-for="col in userColumns"
        :key="col.key"
        :prop="col.key"
        :label="col.label"
      >
        <template v-if="col.key === 'company_id'" #default="{ row }">
          {{ getCompanyName(row.company_id) }}
        </template>
      </el-table-column>
      <el-table-column label="Operations" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openUserDialog(row)">
            Edit
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="deleteUser(row.id)"
          >
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table></el-tab-pane>
    <el-tab-pane :label="TAB_VALUES.COMPANIES.label" :name="TAB_VALUES.COMPANIES.id"> <el-table

      :data="companies"
      height="100%"
      style="width: 100%"
      stripe
      v-loading="loading"
    >
      <el-table-column
        v-for="col in companyColumns"
        :key="col.key"
        :prop="col.key"
        :label="col.label"
      />
      <el-table-column label="Operations" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openCompanyDialog(row)">
            Edit
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="deleteCompany(row.id)"
          >
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table></el-tab-pane>
    <el-tab-pane :label="TAB_VALUES.MULTICAST.label" :name="TAB_VALUES.MULTICAST.id">
      <MulticastPage />
    </el-tab-pane>
  </el-tabs>

    <el-dialog
      :title="(companyForm.id ? 'Edit' : 'Create') + ' Company'"
      v-model="companyDialogVisible"
      width="50%"
    >
      <el-form
        :model="companyForm"
        label-width="120px"
        label-position="top"
        ref="companyFormRef"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="companyForm.name" />
        </el-form-item>

        <el-form-item label="Type" prop="type">
          <el-select v-model="companyForm.type" style="width: 100%">
            <el-option
              v-for="type in companyTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Capacity (tons)" prop="capacity">
          <el-input-number
            v-model="companyForm.capacity"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Owner" prop="owner">
          <el-input v-model="companyForm.owner" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="companyDialogVisible = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleCompanySubmit"
          :loading="submitting"
        >
          {{ companyForm.id ? "Update" : "Create" }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      :title="(userForm.id ? 'Edit' : 'Create') + ' User'"
      v-model="userDialogVisible"
      width="50%"
    >
      <el-form
        :model="userForm"
        label-width="120px"
        label-position="top"
        ref="userFormRef"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="userForm.name" />
        </el-form-item>

        <el-form-item label="Email" prop="email">
          <el-input v-model="userForm.email" type="email" />
        </el-form-item>

        <el-form-item label="Age" prop="age">
          <el-input-number
            v-model="userForm.age"
            :min="18"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Associated Company" prop="company_id">
          <el-select
            v-model="userForm.company_id"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="company in companies"
              :key="company.id"
              :label="`${company.name} (${company.type})`"
              :value="company.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="userDialogVisible = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleUserSubmit"
          :loading="submitting"
        >
          {{ userForm.id ? "Update" : "Create" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  ElLoading,
  ElMessage,
  ElMessageBox,
  ElNotification,
} from "element-plus";
import { companyService } from "../../services/companies";
import { userService } from "../../services/users";
import { commonService } from "../../services";
import MulticastPage from "./MulticastPage.vue";

const TAB_VALUES = {
  COMPANIES: {
      
      label: "Companies Management",
      id: "companies" 
  },
  USERS: {
    label: "Users Management",
    id: "users" 
  },
  MULTICAST: {
    label: "组播监听",
    id: "multicast"
  },
};

const companyColumns = [
  {
    label: "Name",
    key: "name",
  },
  {
    label: "Type",
    key: "type",
  },
  {
    label: "Capacity",
    key: "capacity",
  },
  {
    label: "Owner",
    key: "owner",
  },
  {
    label: "",
    key: "actions",
  },
];

const userColumns = [
  {
    label: "Name",
    key: "name",
  },
  {
    label: "Email",
    key: "email",
  },
  {
    label: "Age",
    key: "age",
  },
  {
    label: "Company",
    key: "company_id",
  },
  {
    label: "",
    key: "actions",
  },
];

// Types

// State
const activeTabId = ref(TAB_VALUES.COMPANIES.id);
const companies = ref([]);
const users = ref([]);
const loading = ref(false);
const submitting = ref(false);

// Forms
const companyForm = ref<{
    id?: number
    name: string;
    type: string;
    capacity: number;
    owner: string;
}>({
  name: "",
  type: "Cargo",
  capacity: 1000,
  owner: "",
});
const userForm = ref<{
    id?: number;
    name: string;
    email: string;
    age: number;
    company_id: number;
}>({
  name: "",
  email: "",
  age: 25,
  company_id: 1,
});

// Refs
const companyFormRef = ref();
const userFormRef = ref();

// Dialogs
const companyDialogVisible = ref(false);
const userDialogVisible = ref(false);

// Constants
const companyTypes = ["Cargo", "Tanker", "Container", "Bulk Carrier"];

// Lifecycle
onMounted(async () => {
  await loadData();
});

// Methods
// const handleClickTab = (tabId: string) => {
//   activeTabId.value = tabId;
// };

// Data Loading
const loadData = async () => {
  try {
    loading.value = true;
    companies.value = await companyService.getCompanyList();
    users.value = await userService.getUserList();
  } catch (error) {
    ElMessage.error("Failed to load data");
  } finally {
    loading.value = false;
  }
};

const handleClickNewButon = () => {
  if (activeTabId.value === TAB_VALUES.COMPANIES.id) {
    openCompanyDialog();
    return;
  }
  openUserDialog();
};

const handleClickExportButton = () => {
  if (activeTabId.value === TAB_VALUES.COMPANIES.id) {
    commonService.exportJson(companies.value, TAB_VALUES.COMPANIES.id);
    return;
  }
  commonService.exportJson(users.value, TAB_VALUES.USERS.id);
};

const handleExportDatabase = async () => {
  try {
    const result = await window.electronAPI.exportDatabase();

    if (result.success) {
      ElMessage.success({
        message: `Database exported to ${result.path}`,
        duration: 5000,
        showClose: true,
      });
    } else if (result.error !== "Export cancelled") {
      ElMessage.error(`Export failed: ${result.error}`);
    }
  } catch (error) {
    ElMessage.error(`Export error: ${error.message}`);
  }
};

const handleExportSql = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: "Generating SQL Query...",
    spinner: "el-icon-loading",
  });

  try {
    const result = await window.electronAPI.exportSqlQuery();

    if (result.success) {
      ElNotification({
        title: "Export Successful",
        message: `SQL file saved at: ${result.path}`,
        type: "success",
        duration: 5000,
      });
    } else if (result.error) {
      ElMessage.error(`Export failed: ${result.error}`);
    }
  } catch (error) {
    ElMessage.error(`Error: ${error.message}`);
  } finally {
    loading.close();
  }
};

const handleImport = async (mode: string) => {
  let result;
  switch (mode) {
    case "json":
      result = await window.electronAPI.importFromJson();
      break;
    case "db":
      result = await window.electronAPI.importDatabaseFile();
      break;
    case "sql":
      result = await window.electronAPI.importFromSqlFile();
      break;
  }
  if (result.success) {
    ElMessage.success("Import thành công!");
    await loadData();
  } else if (result.error !== "No file selected") {
    ElMessage.error(`Import lỗi: ${result.error}`);
  }
};

const handleExport = async (mode: string) => {
  switch (mode) {
    case "json":
      handleClickExportButton();
      break;
    case "db":
      handleExportDatabase();
      break;
    case "sql":
      handleExportSql();
      break;
  }
};

const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      "This will delete ALL data! Continue?",
      "Warning",
      {
        type: "warning",
        customStyle: {
          width: "50%",
        },
      }
    );

    const res = await window.electronAPI.db.reset();
    console.log(res);
    await loadData();
    ElMessage.success("Database reset successfully");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("Reset failed");
    }
  }
};

// Company CRUD
const openCompanyDialog = (company?) => {
  if (company) {
    companyForm.value = { ...company };
  } else {
    companyForm.value = {
      name: "",
      type: "Cargo",
      capacity: 1000,
      owner: "",
    };
  }
  companyDialogVisible.value = true;
};

const handleCompanySubmit = async () => {
  try {
    await companyFormRef.value?.validate();
    submitting.value = true;

    if (companyForm.value.id) {
      await companyService.updateCompany(companyForm.value);
      ElMessage.success("Company updated successfully");
    } else {
      await companyService.createCompany(companyForm.value);
      ElMessage.success("Company created successfully");
    }

    companyDialogVisible.value = false;
    await loadData();
  } catch (error) {
    if (error !== "validate") {
      ElMessage.error(error.message || "Operation failed");
    }
  } finally {
    submitting.value = false;
  }
};

const deleteCompany = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      "This will permanently delete the company and its users. Continue?",
      "Warning",
      {
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        type: "warning",
        customStyle: {
          width: "50%",
        },
      }
    );

    await companyService.deleteCompany(id);
    ElMessage.success("Company deleted");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("Delete failed");
    }
  }
};

// User CRUD
const openUserDialog = (user?) => {
  if (user) {
    userForm.value = { ...user };
  } else {
    userForm.value = {
      name: "",
      email: "",
      age: 25,
      company_id: companies.value[0]?.id || 1,
    };
  }
  userDialogVisible.value = true;
};

const handleUserSubmit = async () => {
  try {
    await userFormRef.value?.validate();
    submitting.value = true;

    if (userForm.value.id) {
      await userService.updateUser(userForm.value);
      ElMessage.success("User updated successfully");
    } else {
      await userService.createUser(userForm.value);
      ElMessage.success("User created successfully");
    }

    userDialogVisible.value = false;
    await loadData();
  } catch (error) {
    if (error !== "validate") {
      ElMessage.error(error.message || "Operation failed");
    }
  } finally {
    submitting.value = false;
  }
};

const deleteUser = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      "This will permanently delete the user. Continue?",
      "Warning",
      {
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        type: "warning",
        customStyle: {
          width: "50%",
        },
      }
    );

    await userService.deleteUser(id);
    ElMessage.success("User deleted");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("Delete failed");
    }
  }
};

// Helper
const getCompanyName = (companyId: number) => {
  return companies.value.find((v) => v.id === companyId)?.name || "N/A";
};
</script>

<style scoped>
.demo-tabs > .el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
</style>