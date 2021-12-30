import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { enforceMaxVersions } from './enforceMaxVersions';
import { PayloadRequest } from '../express/types';

type Args = {
  payload: Payload
  config?: SanitizedCollectionConfig
  req: PayloadRequest
  docWithLocales: any
  id: string | number
}

export const saveCollectionVersion = async ({
  payload,
  config,
  req,
  id,
  docWithLocales,
}: Args): Promise<void> => {
  const VersionsModel = payload.versions[config.slug];

  const version = await payload.performFieldOperations(config, {
    id,
    depth: 0,
    req,
    data: docWithLocales,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess: true,
    flattenLocales: false,
    showHiddenFields: true,
  });

  delete version._id;

  try {
    await VersionsModel.create({
      parent: id,
      version,
      autosave: false,
    });
  } catch (err) {
    payload.logger.error(`There was an error while saving a version for the ${config.labels.singular} with ID ${id}.`);
    payload.logger.error(err);
  }

  if (config.versions.maxPerDoc) {
    enforceMaxVersions({
      id,
      payload: this,
      Model: VersionsModel,
      entityLabel: config.labels.plural,
      entityType: 'collection',
      maxPerDoc: config.versions.maxPerDoc,
    });
  }
};
