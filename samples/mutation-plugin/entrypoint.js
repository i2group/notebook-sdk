/* global notebook */
const personEntityTypeId = "ET5";
const firstNamePropertyTypeId = "PER4";
const familyNamePropertyTypeId = "PER6";

const eventEntityTypeId = "ET2";
const eventTypePropertyTypeId = "EVE3";
const startDateTimePropertyTypeId = "EVE4";
const observedLinkTypeId = "LOB1";

const personData = [
  {
    firstName: "Lou",
    familyName: "Tuft",
  },
  {
    firstName: "Jessy",
    familyName: "Roberts",
  },
  {
    firstName: "Jayme",
    familyName: "Timberson",
  },
];

const eventData = [
  {
    type: "Theft",
    dateTime: "2022-03-01T12:31",
    timeZoneId: "Europe/London",
    wasSeen: "Tuft",
  },
  {
    type: "Arson",
    location: "New York",
    dateTime: "2021-11-23T10:33",
    timeZoneId: "America/New_York",
    wasSeen: "Roberts",
  },
  {
    type: "Assault",
    dateTime: "2022-05-07T17:14",
    timeZoneId: "America/Los_Angeles",
    wasSeen: "Timberson",
  },
];

/**
 * @param {import("@i2analyze/notebook-sdk").data.IKeyedReadOnlyCollection<string,import("@i2analyze/notebook-sdk").data.ITimeZone>} timeZones
 * @param {string} timeZoneId
 */
function getTimeZone(timeZones, timeZoneId) {
  const timeZone = timeZones.get(timeZoneId);
  if (timeZone === undefined) {
    throw new Error("Unknown time zone matching ${timeZoneId}");
  }
  return timeZone;
}

async function main() {
  const api = await notebook.getEntryPointApi(
    "79a7dafb-75eb-4fa2-ae04-660f17df83a6",
    "1.4"
  );
  api.logger.info("Plug-in running");

  const addItems = api.commands.createCommand({
    id: "5edcf067-7cc4-4503-8ad5-cec7e40d6465",
    name: "Add items",
    type: "application",
    icon: {
      type: "inlineSvg",
      svg: '<svg viewBox="0 0 16 16"><rect width="8" height="8" x="4" y="4"/></svg>',
    },
    onExecute(application) {
      const { getItemType } = application.chart.schema;

      const personEntityType = getItemType(personEntityTypeId);
      const firstNamePropertyType = personEntityType.getPropertyType(
        firstNamePropertyTypeId
      );
      const familyNamePropertyType = personEntityType.getPropertyType(
        familyNamePropertyTypeId
      );

      const eventEntityType = getItemType(eventEntityTypeId);
      const eventTypePropertyType = eventEntityType.getPropertyType(
        eventTypePropertyTypeId
      );
      const startDateTimePropertyType = eventEntityType.getPropertyType(
        startDateTimePropertyTypeId
      );

      const observedLinkType = getItemType(observedLinkTypeId);

      api.runTrackedMutations((_application, mutations) => {
        /**
         * @type {Map<string,import("@i2analyze/notebook-sdk").app.IPendingRecord>}
         */
        const personLookup = new Map();

        for (const person of personData) {
          const personRecord = mutations.addEntityRecord({
            itemType: personEntityType,
            properties: {
              [firstNamePropertyType.id]: person.firstName,
              [familyNamePropertyType.id]: person.familyName,
            },
          });

          personLookup.set(person.familyName, personRecord);
        }

        for (const event of eventData) {
          const startDateTime = mutations.valueFactory.createZonedDateTime(
            event.dateTime,
            getTimeZone(api.allTimeZones, event.timeZoneId),
            false
          );

          const eventRecord = mutations.addEntityRecord({
            itemType: eventEntityType,
            properties: {
              [eventTypePropertyType.id]: event.type,
              [startDateTimePropertyType.id]: startDateTime,
            },
          });

          const personSeenRecord = personLookup.get(event.wasSeen);

          if (personSeenRecord === undefined) {
            throw new Error(`Person matching ${event.wasSeen} is missing`);
          }

          mutations.addLinkRecord({
            itemType: observedLinkType,
            fromEnd: eventRecord,
            toEnd: personSeenRecord,
            linkDirection: "with",
          });

          mutations.selection.add(eventRecord);
        }

        return {
          type: "commit",
          actionDisplayName: "Add items",
        };
      });
    },
  });

  api.commands.applicationRibbon.homeTab
    .after(api.commands.applicationRibbon.homeTab.systemGroups.searchInfoStore)
    .surfaceCommands(addItems);

  const arrangeEvents = api.commands.createCommand({
    id: "1d44310e-744c-4f6f-8f65-7fb92a2d8eef",
    name: "Arrange events",
    type: "unscoped",
    icon: {
      type: "inlineSvg",
      svg: '<svg viewBox="0 0 16 16"><rect width="8" height="8" x="4" y="4"/></svg>',
    },
    onExecute() {
      api.runTrackedMutations((application, mutations) => {
        const selection = application.chart.selection;

        if (
          !selection.entityRecords.every(
            (record) => record.itemType.analyzeId === eventEntityTypeId
          )
        ) {
          return {
            type: "rollback",
            report: {
              details: "Selection must contain only Event record types",
              title: "Cannot arrange items",
              type: "error",
            },
          };
        }

        const { getItemType } = application.chart.schema;

        const eventEntityType = getItemType(eventEntityTypeId);
        const startDateTimePropertyType = eventEntityType.getPropertyType(
          startDateTimePropertyTypeId
        );

        /**
         * @param {import("@i2analyze/notebook-sdk").visual.INode} node
         */
        function getEventDate(node) {
          const eventRecord = node.records.firstOrDefault(undefined);

          if (eventRecord === undefined) {
            throw new Error("Unexpected missing record");
          }

          const eventDateTime = eventRecord.getProperty(
            startDateTimePropertyType
          );

          if (
            eventDateTime !== undefined &&
            !eventRecord.isValueUnfetched(eventDateTime)
          ) {
            return /** @type {import("@i2analyze/notebook-sdk").data.IZonedDateTime} */ (
              eventDateTime
            );
          }
        }

        /**
         * @param {import("@i2analyze/notebook-sdk").visual.INode} nodeA
         * @param {import("@i2analyze/notebook-sdk").visual.INode} nodeB
         */
        function compareEvents(nodeA, nodeB) {
          const eventADate = getEventDate(nodeA);
          const eventBDate = getEventDate(nodeB);

          if (eventADate !== undefined && eventBDate !== undefined) {
            const dateA = eventADate.dateTime.toJSDate().getTime();
            const dateB = eventBDate.dateTime.toJSDate().getTime();
            return dateA - dateB;
          } else {
            return 0;
          }
        }

        const firstEvent = selection.affectedNodes.firstOrDefault(undefined);
        if (!firstEvent) {
          return {
            type: "rollback",
            report: {
              title: "Nothing selected",
              details: "Nothing was selected, so no events were arranged.",
              type: "information",
            },
          };
        }

        const sortedEvents = Array.from(selection.affectedNodes).sort(
          compareEvents
        );

        const targetLocation = firstEvent.center;
        let targetX = targetLocation.x;

        for (const event of sortedEvents) {
          mutations
            .editNode(event)
            .setCenter({ x: targetX, y: targetLocation.y });
          targetX += 200;
        }

        mutations.view.fitToSelection();

        return {
          type: "commit",
          actionDisplayName: "Arrange events",
        };
      });
    },
  });

  api.commands.applicationRibbon.homeTab
    .after(addItems)
    .surfaceCommands(arrangeEvents);

  api.initializationComplete();
}

void main();
