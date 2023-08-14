<template>
  <div :dir="toolViewApi.locale.flowDirection" :class="themeClass">
    <div class="record-navigation">
      <div>{{ navigationTitle }}</div>
      <div class="navigation-buttons" v-if="totalRecords">
        <button
          class="navigation-button"
          @click="onPreviousButtonClick"
          title="Previous record"
          :disabled="disablePreviousButton"
        >
          &lt;
        </button>
        <button
          class="navigation-button"
          @click="onNextButtonClick"
          title="Next record"
          :disabled="disableNextButton"
        >
          &gt;
        </button>
      </div>
    </div>
    <h1 class="record-header">
      <img
        v-if="image"
        :src="image.href"
        :alt="image.description"
        class="record-image"
      />
      <a
        v-if="threeSixtyUrl"
        :href="threeSixtyUrl"
        target="_blank"
        class="record-label"
        >{{ recordLabel }}</a
      >
      <span v-else class="record-label">{{ recordLabel }}</span>
    </h1>
    <div class="record-properties">
      <div class="property" v-for="property in properties" :key="property.id">
        <div class="property-label">{{ property.label }}</div>
        <div class="property-value">{{ property.value }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { data, records, schema, toolview } from "@i2analyze/notebook-sdk";
import { defineComponent, PropType } from "vue";

interface IProperty {
  id: schema.ChartPropertyTypeId;
  label: string;
  value: string;
}

export default defineComponent({
  name: "ToolView",
  props: {
    toolViewApi: {
      type: Object as PropType<toolview.IToolViewApi>,
      required: true,
    },
  },
  data() {
    return {
      recordLabel: "",
      properties: [] as IProperty[],
      threeSixtyUrl: undefined as string | undefined,
      image: undefined as data.IImage | undefined,
      currentRecordIndex: 0,
      totalRecords: 0,
    };
  },
  computed: {
    themeClass(): string {
      return this.toolViewApi.theme.appearance === "dark"
        ? "dark-theme"
        : "light-theme";
    },
    disablePreviousButton(): boolean {
      return this.currentRecordIndex === 0;
    },
    disableNextButton(): boolean {
      return this.currentRecordIndex === this.totalRecords - 1;
    },
    currentRecord(): number {
      return this.currentRecordIndex + 1;
    },
    navigationTitle(): string {
      const formatter = this.toolViewApi.formatter;

      if (this.totalRecords === 0) {
        return formatter.wrapForBidi("No records selected.", "raw");
      }

      const currentRecord = formatter.formatValue(this.currentRecord);
      const totalRecords = formatter.formatValue(this.totalRecords);

      return formatter.wrapForBidi(
        `Record ${currentRecord} of ${totalRecords}`,
        "raw"
      );
    },
  },
  methods: {
    handleChartSelectionChange() {
      this.currentRecordIndex = 0;
      this.readDataForCurrentRecord();
    },
    readDataForCurrentRecord() {
      this.toolViewApi.runTransaction(async(application) => {
        const records = application.chart.selection.records;
        const recordIds = Array.from(records.map((r) => r.id));
        this.totalRecords = records.size;

        const currentRecordId = recordIds[this.currentRecordIndex];
        const record = records.get(currentRecordId);

        if (record) {
          const propertyTypes = record.itemType.propertyTypes;

          await application.chart.ensurePropertiesFetched(record, propertyTypes);
        }

        this.setValuesForRecord(record);
      });
    },
    setValuesForRecord(record: records.IChartRecord | undefined) {
      const formatter = this.toolViewApi.formatter;

      if (record) {
        this.recordLabel = formatter.wrapForBidi(record.labelOrFallback, "raw");
        this.threeSixtyUrl = record.get360ViewUrl();
        this.image =
          record.image ||
          (record.isEntity() ? record.itemType.image : undefined);

        const properties: IProperty[] = [];
        for (const propertyType of record.itemType.propertyTypes) {
          const label = formatter.wrapForBidi(propertyType.displayName, "raw");
          const value = record.getProperty(propertyType);

          if (value !== undefined && !record.isValueUnfetched(value)) {
            const formattedValue = formatter.formatValue(value);

            properties.push({
              id: propertyType.id,
              label,
              value: formatter.wrapForBidi(formattedValue, "raw"),
            });
          }
        }

        this.properties = properties;
      } else {
        this.recordLabel = "";
        this.threeSixtyUrl = undefined;
        this.image = undefined;
        this.properties = [];
      }
    },
    onPreviousButtonClick() {
      this.currentRecordIndex--;
      this.readDataForCurrentRecord();
    },
    onNextButtonClick() {
      this.currentRecordIndex++;
      this.readDataForCurrentRecord();
    },
  },
  mounted() {
    this.toolViewApi.addEventListener(
      "chartselectionchange",
      this.handleChartSelectionChange
    );

    this.toolViewApi.addEventListener("unload", (isClosing) => {
      if (isClosing) {
        this.toolViewApi.volatileStore.clear();
      } else {
        this.toolViewApi.volatileStore.set(
          "currentRecordIndex",
          this.currentRecordIndex
        );
      }
    });

    this.currentRecordIndex =
      this.toolViewApi.volatileStore.get("currentRecordIndex") || 0;

    this.readDataForCurrentRecord();
  },
  unmounted() {
    this.toolViewApi.removeEventListener(
      "chartselectionchange",
      this.handleChartSelectionChange
    );
  },
});
</script>

<style scoped>
.dark-theme {
  color: white;
}

.light-theme {
  color: black;
}

.record-header {
  /* Override the default browser styling of h1s */
  font-size: 20px;
  margin: 0;
}

.record-properties {
  padding: 8px;
  font-size: 16px;
}

.property {
  padding: 4px 0;
}

.property-label {
  font-weight: bold;
}

.property-value {
  padding: 4px 0 0;
}

.record-image {
  width: 80px;
  height: 80px;
  object-fit: scale-down;
  object-position: center top;
}

.record-label {
  padding: 0 8px;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px;
}

.navigation-button {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;

  /* Stop the default browser styling */
  margin: 0;
  padding: 0;
}

.navigation-buttons {
  display: flex;
}

.record-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
