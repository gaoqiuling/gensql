<template>
  <el-config-provider namespace="ep">
    <div style="margin: 20px">
      <el-row>
        <el-col :span="12">
          <el-form @submit.prevent>
            <el-form-item>
              <el-select @change="dbChange" filterable v-model="schemaName">
                <el-option
                  v-for="item in dbs"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-select @change="tableChange" filterable v-model="tableName">
                <el-option
                  v-for="item in tables"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-col :span="6" :offset="1">
                <el-button type="info" @click="generate">生成</el-button>
              </el-col>
            </el-form-item>
            <el-form-item>
              <el-input
                v-model="textarea"
                :rows="10"
                type="textarea"
                placeholder="请粘贴文字"
              />
            </el-form-item>
            <el-form-item label="是否使用数据库自增主键">
              <el-radio-group
                v-model="useTableIncrement"
                :disabled="!canUseTableIncrement"
              >
                <el-radio :label="0">不使用</el-radio>
                <el-radio :label="1">使用</el-radio>
              </el-radio-group>
            </el-form-item>
            <div v-for="(item, index) in columns" :key="index">
              <el-form-item
                :label="'替换列【' + item.columnName + '】为固定文字'"
              >
                <el-input
                  :disabled="useTableIncrement && item.isPk == 1"
                  v-model="item.text"
                />
              </el-form-item>
            </div>
          </el-form>
        </el-col>
        <el-col :span="11" :offset="1" style="text-align: left">
          <!-- <el-button type="default" @click="copy" style="margin-bottom: 20px"
            >复制</el-button
          > -->
          <h3>生成结果</h3>
          <el-input v-model="content" :rows="30" type="textarea" readonly />
        </el-col>
      </el-row>
    </div>
  </el-config-provider>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { get } from "./network";

interface ListItem {
  value: string;
  label: string;
}

interface ColumnType {
  columnName: string;
  isPk: number;
  isIncrement: number;
  text: string;
}

const content = ref("");
const dbs = ref<ListItem[]>([]);
const tables = ref<ListItem[]>([]);
const useTableIncrement = ref(0);
const canUseTableIncrement = ref(true);
const columns = ref([] as ColumnType[]);
const schemaName = ref("");
const tableName = ref("");
const textarea = ref("");

onMounted(async () => {
  let res = await get({ url:  `http://localhost:7001/allSchemas` });
  dbs.value = res.map((item: string) => {
    return { value: `${item}`, label: `${item}` };
  });
});

const dbChange = async () => {
  console.log(schemaName.value);
  let res = await get({
    url:  `http://localhost:7001/allTablesOfSchema?schemaName=${schemaName.value}`,
  });
  tables.value = res.map((item: string) => {
    return { value: `${item}`, label: `${item}` };
  });
};

const tableChange = async () => {
  let res = await get({
    url:  `http://localhost:7001/allColumnsOfTable?schemaName=${schemaName.value}&tableName=${tableName.value}`,
  });
  columns.value = res;
  canUseTableIncrement.value =
    res.filter((item: ColumnType) => item.isPk && item.isIncrement).length > 0;
};

const generate = () => {
  content.value = "";
  let lines = textarea.value.trim().split("\n");
  if (lines.length == 1 && lines[0] == "") {
    ElMessage.error("没有内容");
    return;
  }
  let sql = `insert into ${tableName.value} (`;
  for (let i = useTableIncrement.value; i < columns.value.length; i++) {
    sql += columns.value[i].columnName + ",";
  }
  sql = sql.substring(0, sql.length - 1) + ") values \n";
  for (let j = 0; j < lines.length; j++) {
    sql += "(";
    let v = lines[j].split(", ");
    let count = v.length;
    for (let i = useTableIncrement.value; i < columns.value.length; i++) {
      if (
        columns.value[i].text === undefined ||
        columns.value[i].text.trim() == ""
      ) {
        if (i < count) {
          sql += v[i] + ",";
        } else {
          sql += "'',";
        }
      } else {
        sql += columns.value[i].text.trim() + ",";
      }
    }
    sql = sql.substring(0, sql.length - 1) + "),\r\n";
  }
  sql = sql.substring(0, sql.lastIndexOf(",")) + ";";
  content.value = sql;
};

const copy = () => {
  console.log(content.value);
  navigator.clipboard.readText().then((clipText) => content.value);
  ElMessage.success("复制成功");
};
</script>

<style>
#app {
  text-align: center;
  color: var(--ep-text-color-primary);
}

.element-plus-logo {
  width: 50%;
}

.ep-button {
  margin: 4px;
}
</style>
