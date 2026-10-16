/*
 * Adds the shared "Layout" fields (models/_layout.json) to every block model.
 *
 * Runs after merge-json-cli has produced component-models.json and
 * component-definition.json (see "build:json:layout" in package.json).
 * New blocks get the layout controls automatically - nothing to add by hand.
 *
 * A block is any top level definition that uses the xwalk "block" or "columns"
 * resource type. Child items (".../block/v1/block/item") are skipped.
 * Blocks that have no model yet (e.g. cards, slider) get one that only
 * contains the layout fields.
 */
import { readFile, writeFile } from 'node:fs/promises';

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const writeJson = (file, data) => writeFile(file, `${JSON.stringify(data, null, 2)}\n`);

const BLOCK_TYPES = [
  'core/franklin/components/block/v1/block',
  'core/franklin/components/columns/v1/columns',
];

const { fields: layoutFields } = await readJson('models/_layout.json');
const models = await readJson('component-models.json');
const definitions = await readJson('component-definition.json');

const withoutLayout = (fields) => fields.filter(({ name }) => !name?.startsWith('classes_layout'));
let changedDefinitions = false;

definitions.groups.forEach((group) => {
  group.components.forEach((component) => {
    const { page } = component.plugins?.xwalk ?? {};
    if (!page || !BLOCK_TYPES.includes(page.resourceType)) return;

    const isColumns = page.resourceType.includes('/columns/');
    const modelId = page.template?.model ?? (isColumns ? component.id : undefined);
    let model = models.find(({ id }) => id === modelId);

    if (!model && !isColumns) {
      // block without a model: create one that only holds the layout fields
      model = { id: component.id, fields: [] };
      models.push(model);
      page.template = { ...page.template, model: component.id };
      changedDefinitions = true;
    }
    if (!model) return;

    model.fields = [...withoutLayout(model.fields ?? []), ...layoutFields];
  });
});

await writeJson('component-models.json', models);
if (changedDefinitions) await writeJson('component-definition.json', definitions);
