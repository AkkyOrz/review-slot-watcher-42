import assertIsDefined from './assertIsDefined.js';

type CredentialsTokyo42 = {
  name: string;
  password: string;
};

type SetCredentials = (envVars: NodeJS.ProcessEnv) => CredentialsTokyo42;

const setCredentials: SetCredentials = (envVars: NodeJS.ProcessEnv) => {
  assertIsDefined(envVars.TOKYO_42_USERNAME);
  assertIsDefined(envVars.TOKYO_42_PASSWORD);

  const credentials: CredentialsTokyo42 = {
    name: envVars.TOKYO_42_USERNAME,
    password: envVars.TOKYO_42_PASSWORD,
  };

  return credentials;
};

export { setCredentials };
export type { CredentialsTokyo42, SetCredentials };
