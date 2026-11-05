# AGENTS.md — i2 Notebook Web SDK

Guidance for AI coding assistants (Claude Code, Cursor, Copilot, etc.) writing i2 Analyst's
Notebook **web client plug-ins** with `@i2analyze/notebook-sdk`. Follow this over habits learned
from other SDKs. If a rule here conflicts with a code sample you found online, this file wins.

Docs: https://i2group.github.io/notebook-sdk/ · API reference: https://i2group.github.io/notebook-sdk/api/ · Machine-readable: https://i2group.github.io/notebook-sdk/llms.txt

---

## 0. The one rule that matters most: how to start a plug-in

**To create a NEW plug-in project, ALWAYS scaffold with the tool. Never hand-write a project
skeleton, and never copy a sample or tutorial as the starting boilerplate.**

```sh
npm create @i2analyze/notebook-plugin       # or: npx @i2analyze/create-notebook-plugin
```

Templates (pass `--template=`):

- `plugin` (default) — headless plug-in with an `entrypoint.ts`, no UI.
- `plugin-with-toolview` — adds a React tool view (`ToolView` component + `index.html`).

```sh
npm create @i2analyze/notebook-plugin -- --template=plugin-with-toolview
```

The scaffold wires up TypeScript, ESLint, Prettier, webpack production bundling, the dev proxy
(`devproxy.json`), and a correct `plugin.json` manifest. Reproducing this by hand gets the manifest,
CSP, version pinning, and build config subtly wrong.

> ❌ **Do NOT** treat `samples/basic-plugin` or the guide page **"Creating a basic plug-in for the
> i2 Web Client"** (`tutorials/basic-plugin.md`) as the recommended boilerplate. Those exist to
> *explain concepts from first principles*. The recommended path for real plug-ins is the
> **`create-notebook-plugin` tool** and its tutorial (`tutorials/create-notebook-plugin.md`).
> When a user asks you to "make a plug-in", scaffold with the tool, then edit `src/entrypoint.ts`.

If you cannot run the scaffolder (e.g. offline), say so explicitly and reproduce the generated
`plugin/` template structure faithfully rather than inventing a layout.

---

## 1. Mental model

A plug-in is static assets (JS + a `plugin.json` manifest) served to the i2 Web Client. Three parts:

1. **Manifest** (`public/plugin.json`) — identity (`pluginId`, `name`, `pluginVersion`), the
   `entryPointUrl`, and CSP. Schema:
   `https://i2group.github.io/notebook-sdk/schemas/plugin-manifest.json` (keep the `$schema` line —
   it gives editors and agents live validation).
2. **Entry point** (`src/entrypoint.ts`) — runs on load. Acquires the versioned API, registers
   capabilities (commands, tool views), then calls `api.initializationComplete()`.
3. **Tool views** (optional) — iframed HTML/JS UIs (React in the template) for richer interaction.

## 2. Acquiring the API — the version you request is a minimum, not "your SDK version"

```ts
import { NotebookStatic } from '@i2analyze/notebook-sdk';
declare const notebook: NotebookStatic;

async function main() {
  const api = await notebook.getEntryPointApi('<your-plugin-id>', '1.3'); // minimum API version required
  // ...register capabilities...
  api.initializationComplete();
}
main();
```

- The `major.minor` you pass is the **minimum API version your plug-in needs from the deployed
  i2 Notebook backend** — *not* the version of the SDK you happened to install. The call asks the
  running server "do you serve a client that supports at least this API version?" and **rejects** if
  the server is older than requested (or if `pluginId` is absent from the manifest).
- **Choose the lowest version that includes every API you actually use.** A lower number runs on a
  wider range of i2 Analyze servers; a higher number requires a newer server but unlocks newer APIs.
  See the SDK ↔ i2 Analyze compatibility table in the *SDK and API versioning* guide.
- Ceiling: it can't exceed the API version of the installed `@i2analyze/notebook-sdk` (you can only
  call types the SDK ships). Within that ceiling, prefer the floor. The `create-notebook-plugin`
  scaffold sets a deliberately low default (currently `1.3`) for broad compatibility — only raise it
  when you adopt an API introduced in a later version. **Do not "upgrade" it to match the SDK.**
- (The templates use the unbundled global `notebook`, so you choose the version explicitly. If you
  instead `import { getEntryPointApi }` from the SDK and bundle it, that entry point uses the SDK's
  own version automatically.)
- Keep the `pluginId` identical in code and manifest.
- You **must** call `api.initializationComplete()` once setup is done, or the plug-in never finishes loading.

## 3. Commands (the primary way to add behaviour)

Create with `api.commands.createCommand({...})`, then *surface* it into one or more UI locations.
Command `type` scopes the execution context: `'unscoped'`, `'records'`, etc. The scaffold uses
`'unscoped'`; switch to `'records'` when you act on the current selection.

```ts
const cmd = api.commands.createCommand({
  id: 'view-on-map',
  name: 'View on map',
  icon: { type: 'inlineSvg', svg: commandSvg },
  type: 'records',
  onExecute(payload: commands.IRecordsContext) { /* ... */ },
  onSurface(action, eventApi, signal) {
    // Control enablement per surfacing. dispatchNow runs the callback immediately;
    // forwarding `signal` auto-unsubscribes when this surfacing is removed.
    eventApi.addEventListener('recordscontextchange',
      (ctx) => action.setEnabled(/* predicate over ctx.records */ true),
      { dispatchNow: true, signal });
  },
});

api.commands.applicationRibbon.homeTab.surfaceCommands(cmd);
api.commands.chartPopupMenu.surfaceCommands(cmd); // same command, multiple places
```

**Best practice:** gate enablement in `onSurface` via events rather than leaving buttons always-on;
always forward `signal` to listeners so they clean up on unsurface.

## 4. Reading data

Access via the versioned `data` / `records` / `chart` namespaces. Records expose typed properties
through their `itemType`.

- Iterate `record.itemType.propertyTypes`; read with `record.getProperty(propertyType)`.
- **Check `record.isValueUnfetched(property)` before use** — the client lazily loads values, and an
  unfetched value is not the same as an empty one. See guide: *Unfetched property values*.
- Collections are `data.IReadOnlyCollection<T>` (use `.size`, `.firstOrDefault(undefined)`), not JS arrays.

## 5. Changing data — tracked vs untracked mutations

All writes go through a mutation callback; never mutate model objects directly.

- **`runTrackedMutations`** — for changes that modify data (add/edit/delete records, notes, etc.).
  These are undoable and validated. Return `{ type: 'commit' }` or `{ type: 'rollback' }`.
- **`runUntrackedMutations`** — for view-only changes that don't touch data, e.g. selection or
  untracked element style. Lighter weight; not part of undo history.

```ts
await api.runTrackedMutations(async (application, mutations, cancelation) => {
  if (application.chart.selection.records.size === 0) return { type: 'rollback' }; // no-op, not an error
  const id = mutations.addEntityRecord({ itemType, properties: {}, notes: [], security, sourceReferences: [] });
  return { type: 'commit' };
});
```

Guides: *Changing data from a plug-in*, *Supported mutation operations*, *Untracked element style editing*.

## 6. Dev loop, build, deploy

- `npm run dev` — dev server + `notebook-sdk-plugin-proxy` (proxies to your i2 Analyze server; edit
  `devproxy.json` to change the target). Open the Web Client and look for your ribbon button /
  console message.
- `npm run build` — production webpack bundle into `dist/`.
- **Deploy:** copy `dist/` into the server's
  `toolkit/configuration/fragments/opal-services/plugins/<your-plugin>/`, then
  `setup -t stopLiberty && setup -t deployLiberty && setup -t startLiberty` (repeat on every Liberty
  node in HA). Guide: *Deploying to an i2 Analyze server*.

## 7. Versioned API namespaces

Import types from `@i2analyze/notebook-sdk`; the runtime API is grouped into:
`app`, `chart`, `commands`, `data`, `dialog`, `records`, `schema`, `toolview`, `visual`
(plus `ILogger`, `IEntryPointApi`, `LogLevel`). Prefer these typed namespaces over `any`.

## 8. Footguns / anti-patterns

- ❌ Hand-rolling the project or copying `basic-plugin` — see §0.
- ❌ Guessing the API version, or letting manifest `pluginId` drift from the code id.
- ❌ Forgetting `api.initializationComplete()`.
- ❌ Reading a property without an `isValueUnfetched` check.
- ❌ Using `runTrackedMutations` for selection-only changes (use untracked), or mutating model objects outside a mutation callback.
- ❌ Leaving commands always-enabled instead of gating in `onSurface`.
- ⚠️ Before relying on a member, check its `@i2since` tag in the API reference: it names the API
  version that introduced it. If you use it, the plug-in's requested minimum version (§2) must be at
  least that value. The public API is a single stable surface — there are no `@beta`/`@alpha` tiers.

## 9. When unsure

Prefer these accurate sources over memory: the API reference
(https://i2group.github.io/notebook-sdk/api/), the guide, the `samples/` directory, and
`packages/notebook-sdk/src/use-the-api.ts` (worked mutation examples). For machine ingestion, fetch
`https://i2group.github.io/notebook-sdk/llms-full.txt`.
