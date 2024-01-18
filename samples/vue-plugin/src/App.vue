<template>
  <div v-if="toolViewApi">
    <ToolView :toolViewApi="toolViewApi" />
  </div>
</template>

<script lang="ts">
import { getToolViewApi, toolview } from "@i2analyze/notebook-sdk";
import { defineComponent } from "vue";

import ToolView from "./components/ToolView.vue";

export default defineComponent({
  name: "App",
  components: {
    ToolView,
  },
  data() {
    return {
      toolViewApi: undefined as toolview.IToolViewApi | undefined,
    };
  },
  async mounted() {
    this.toolViewApi = await getToolViewApi();
  },
});
</script>

<style></style>
