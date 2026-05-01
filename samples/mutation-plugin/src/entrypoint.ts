import { NotebookStatic } from '@i2analyze/notebook-sdk';
import commandSvg from './assets/plugin-command.svg';
import type { app, data, visual } from '@i2analyze/notebook-sdk';

declare const notebook: NotebookStatic;

function getRequiredType<K, V>(collection: { get(k: K): V | undefined }, key: K): V {
  const item = collection.get(key);
  if (!item) {
    throw new Error(`${key} is missing`);
  }
  return item;
}

function getTimeZone(
  timeZones: data.IKeyedReadOnlyCollection<string, data.ITimeZone>,
  timeZoneId: string
) {
  const timeZone = timeZones.get(timeZoneId);
  if (timeZone === undefined) {
    throw new Error(`No time zone matches ${timeZoneId}`);
  }
  return timeZone;
}

const personLookup = new Map<string, app.IPendingRecord>();

const personData = [
  {
    firstName: 'Lou',
    familyName: 'Tuft',
  },
  {
    firstName: 'Jessy',
    familyName: 'Roberts',
  },
  {
    firstName: 'Jayme',
    familyName: 'Timberson',
  },
];

const eventData = [
  {
    type: 'Theft',
    dateTime: '2022-03-01T12:31',
    timeZoneId: 'Europe/London',
    wasSeen: 'Tuft',
  },
  {
    type: 'Arson',
    location: 'New York',
    dateTime: '2021-11-23T10:33',
    timeZoneId: 'America/New_York',
    wasSeen: 'Roberts',
  },
  {
    type: 'Assault',
    dateTime: '2022-05-07T17:14',
    timeZoneId: 'America/Los_Angeles',
    wasSeen: 'Timberson',
  },
];

async function main() {
  const api = await notebook.getEntryPointApi('e5dd4f4c-80c7-4ad7-8f34-107473c328c0', '1.9');

  const addRecords = api.commands.createCommand({
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Add items',
    type: 'application',
    icon: {
      type: 'inlineSvg',
      svg: commandSvg,
    },
    onExecute(application) {
      const personEntityType = getRequiredType(application.chart.schema.entityTypes, 'Person');
      const firstNamePropertyType = getRequiredType(
        personEntityType.propertyTypes,
        'First (Given) Name'
      );
      const familyNamePropertyType = getRequiredType(personEntityType.propertyTypes, 'Family Name');

      const eventEntityType = getRequiredType(application.chart.schema.entityTypes, 'Event');
      const eventTypePropertyType = getRequiredType(eventEntityType.propertyTypes, 'Event Type');
      const startDateTimePropertyType = getRequiredType(
        eventEntityType.propertyTypes,
        'Event Start Date and Time'
      );
      const observedLinkType = getRequiredType(application.chart.schema.linkTypes, 'Observed');

      api.runTrackedMutations((_application, mutations) => {
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

          mutations.selection.add(eventRecord);

          const personSeenRecord = personLookup.get(event.wasSeen);

          if (personSeenRecord === undefined) {
            throw new Error(`Person matching ${event.wasSeen} is missing`);
          }

          mutations.addLinkRecord({
            itemType: observedLinkType,
            fromEnd: eventRecord,
            toEnd: personSeenRecord,
            linkDirection: 'with',
          });
        }

        return {
          type: 'commit',
          actionDisplayName: 'Add records',
        };
      });
    },
  });

  api.commands.applicationRibbon.homeTab
    .after(api.commands.applicationRibbon.homeTab.systemGroups.chartManagement)
    .surfaceCommands(addRecords);

  const arrangeEvents = api.commands.createCommand({
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Arrange events',
    type: 'unscoped',
    icon: {
      type: 'inlineSvg',
      svg: '<svg viewBox="0 0 16 16"><rect width="8" height="8" x="4" y="4"/></svg>',
    },
    onExecute() {
      api.runTrackedMutations((application, mutations) => {
        const selection = application.chart.selection;
        const eventEntityType = getRequiredType(application.chart.schema.entityTypes, 'Event');

        if (!selection.entityRecords.every((record) => record.itemType === eventEntityType)) {
          return {
            type: 'rollback',
            report: {
              details: 'Selection must contain only Event record types',
              title: 'Cannot arrange items',
              type: 'error',
            },
          };
        }

        const startDateTimePropertyType = getRequiredType(
          eventEntityType.propertyTypes,
          'Event Start Date and Time'
        );

        function getEventDate(node: visual.INode) {
          const eventRecord = node.records.firstOrDefault(undefined);

          if (eventRecord === undefined) {
            throw new Error('Unexpected missing record');
          }

          const eventDateTime = eventRecord.getProperty(startDateTimePropertyType);

          if (eventDateTime !== undefined && !eventRecord.isValueUnfetched(eventDateTime)) {
            return eventDateTime as data.IZonedDateTime;
          }
        }

        function compareEvents(nodeA: visual.INode, nodeB: visual.INode) {
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
            type: 'rollback',
            report: {
              title: 'Nothing selected',
              details: 'Nothing was selected, so no events were arranged.',
              type: 'information',
            },
          };
        }

        const sortedEvents = Array.from(selection.affectedNodes).sort(compareEvents);

        const targetLocation = firstEvent.center;
        let targetX = targetLocation.x;

        for (const event of sortedEvents) {
          mutations.editNode(event).setCenter({ x: targetX, y: targetLocation.y });
          targetX += 200;
        }

        mutations.view.fitToSelection();

        return {
          type: 'commit',
          actionDisplayName: 'Arrange events',
        };
      });
    },
  });

  api.commands.applicationRibbon.homeTab.after(addRecords).surfaceCommands(arrangeEvents);

  api.initializationComplete();
}

main();
