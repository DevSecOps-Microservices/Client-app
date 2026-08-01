import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://192.168.11.121:8080',
  realm: 'incidents-realm',
  clientId: 'incidents-client',
});

export default keycloak;

