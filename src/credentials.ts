import assertIsDefined from './assertIsDefined.js';

type CredentialsTokyo42 = {
  name: string;
  password: string;
  url: string;
};

type SetCredentials = (envVars: NodeJS.ProcessEnv) => CredentialsTokyo42;

const setCredentials: SetCredentials = (envVars: NodeJS.ProcessEnv) => {
  assertIsDefined(envVars.TOKYO_42_USERNAME);
  assertIsDefined(envVars.TOKYO_42_PASSWORD);
  assertIsDefined(envVars.FT_URL);

  const credentials: CredentialsTokyo42 = {
    name: envVars.TOKYO_42_USERNAME,
    password: envVars.TOKYO_42_PASSWORD,
    url: envVars.FT_URL,
  };

  return credentials;
};

export { setCredentials };
export type { CredentialsTokyo42, SetCredentials };
