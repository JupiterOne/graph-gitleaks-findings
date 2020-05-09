const highSeverityTags = ['Facebook', 'RSA', 'EC', 'Google', 'Twitter', 'NPM', 'AWS'];
/**
 * Add additional ignore certain file paths as needed. For example:
 * const lowSeverityFilePathFragments = ['test', 'fixture', 'snapshot'];
 */
const lowSeverityFilePathFragments = ['node_modules', '.lock'];

function toFindingEntity(gitleaksJson, provider, org) {
  const ignorable = lowSeverityFilePathFragments.some(fragment => {
    if (gitleaksJson.file.toLowerCase().indexOf(fragment) > -1) {
      return true;
    }
  });

  if (ignorable) {
    return undefined;
  }

  let repoName = gitleaksJson.repo;
  if (gitleaksJson.repo.indexOf('.git') > -1) {
    repoName = gitleaksJson.repo.slice(0, -4); // remove .git suffix, if present
  }

  const highSeverity = highSeverityTags.some(sevTag => {
    if (gitleaksJson.tags.indexOf(sevTag) > -1) {
      return true;
    }
  });

  const newEntity = {
    entityKey: `gitleaks-finding-${repoName}-${gitleaksJson.commit}`,
    entityType: 'gitleaks_finding',
    entityClass: 'Finding',
    properties: {
      ...gitleaksJson,
      name:`${repoName}-${gitleaksJson.rule}`,
      displayName: `${repoName}-${gitleaksJson.rule}`,
      targets: `${org}/${repoName}`,
      repoName: repoName,
      repoOwner: org,
      repoType: `${provider.toLowerCase()}_repo`,
      open: true,
      severity: highSeverity ? 'high' : 'info',
    },
  };

  if (provider === 'github') {
    newEntity.properties.webLink =
      `https://github.com/${org}/${repoName}/tree/${gitleaksJson.commit}/${gitleaksJson.file}`;
  } else if (provider === 'bitbucket') {
    newEntity.properties.webLink =
      `https://bitbucket.org/${org}/${reporName}/src/${gitleaksJson.commit}/${gitleaksJson.file}`;
  }

  return newEntity;
}

function toFindingEntities(gitleaks, source, org) {
  const entities = [];
  for (const obj of gitleaks) {
    const entity = toFindingEntity(obj, source, org);
    if (entity) {
      entities.push(entity);
    }
  }
  return entities;
}

async function createEntities(j1Client, entities) {
  for (const e of entities) {
    const classLabels = Array.isArray(e.entityClass)
      ? e.entityClass
      : [e.entityClass];

    e.properties.createdOn = e.properties.createdOn
      ? new Date(e.properties.createdOn).getTime()
      : new Date().getTime();

    await j1Client.createEntity(
      e.entityKey,
      e.entityType,
      classLabels,
      e.properties
    );
  }
}

module.exports = {
  createEntities,
  toFindingEntities
};
